// Each test gets a fresh module (and fresh _dbPromise singleton) via isolateModules.

const makeDB = (overrides?: { run?: jest.Mock; all?: jest.Mock }) => ({
  run: overrides?.run ?? jest.fn().mockResolvedValue(undefined),
  all: overrides?.all ?? jest.fn().mockResolvedValue([]),
});

function loadModule(initDBImpl: () => Promise<ReturnType<typeof makeDB>>) {
  let getDB!: () => Promise<ReturnType<typeof makeDB>>;
  jest.isolateModules(() => {
    jest.doMock('../src/storage', () => ({ initDB: initDBImpl }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ getDB } = require('../src/db'));
  });
  return { getDB };
}

describe('getDB', () => {
  it('returns the same instance on repeated calls', async () => {
    const initDB = jest.fn().mockResolvedValue(makeDB());
    const { getDB } = loadModule(initDB);

    const a = await getDB();
    const b = await getDB();
    expect(a).toBe(b);
    expect(initDB).toHaveBeenCalledTimes(1);
  });

  it('re-opens after run() throws "already released"', async () => {
    const releasedError = new Error('Cannot use shared object that was already released');
    const first = makeDB({ run: jest.fn().mockRejectedValueOnce(releasedError) });
    const second = makeDB();
    const initDB = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const { getDB } = loadModule(initDB);

    const db = await getDB();
    await expect(db.run('SELECT 1')).rejects.toThrow('already released');

    // singleton cleared — next call re-opens
    const db2 = await getDB();
    expect(initDB).toHaveBeenCalledTimes(2);
    expect(db2).not.toBe(db);
  });

  it('re-opens after all() throws "already released"', async () => {
    const releasedError = new Error('Cannot use shared object that was already released');
    const first = makeDB({ all: jest.fn().mockRejectedValueOnce(releasedError) });
    const second = makeDB();
    const initDB = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const { getDB } = loadModule(initDB);

    const db = await getDB();
    await expect(db.all('SELECT 1')).rejects.toThrow('already released');

    const db2 = await getDB();
    expect(initDB).toHaveBeenCalledTimes(2);
    expect(db2).not.toBe(db);
  });

  it('stale wrapper does not clobber a fresh connection', async () => {
    // db1 gets released; a second call on the stale wrapper fires reset()
    // while db2 is already open — db2's promise must survive.
    const releasedError = new Error('Cannot use shared object that was already released');
    const staleRun = jest.fn()
      .mockRejectedValueOnce(releasedError)  // first call: triggers reset + re-open
      .mockRejectedValueOnce(releasedError); // second call on same stale wrapper
    const first = makeDB({ run: staleRun });
    const second = makeDB();
    const initDB = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const { getDB } = loadModule(initDB);

    const staleDB = await getDB();
    await expect(staleDB.run('q')).rejects.toThrow('already released'); // clears singleton
    const freshDB = await getDB(); // opens db2, _dbPromise = p2
    expect(freshDB).not.toBe(staleDB);

    // second call on the stale wrapper must NOT null out _dbPromise (which now points to p2)
    await expect(staleDB.run('q')).rejects.toThrow('already released');
    const stillFresh = await getDB();
    expect(initDB).toHaveBeenCalledTimes(2); // no third open
    expect(stillFresh).toBe(freshDB);
  });

  it('re-opens after initDB() rejects', async () => {
    const initError = new Error('disk I/O error');
    const good = makeDB();
    const initDB = jest.fn()
      .mockRejectedValueOnce(initError)
      .mockResolvedValueOnce(good);
    const { getDB } = loadModule(initDB);

    await expect(getDB()).rejects.toThrow('disk I/O error');

    // singleton must have been cleared — next call retries
    const db = await getDB();
    expect(initDB).toHaveBeenCalledTimes(2);
    // db is the wrapped version of good — verify it works (good.run is callable)
    await db.run('SELECT 1');
    expect(good.run).toHaveBeenCalledTimes(1);
  });

  it('does not reset singleton for unrelated errors', async () => {
    const syntaxError = new Error('syntax error near "SELEKT"');
    const db0 = makeDB({ run: jest.fn().mockRejectedValueOnce(syntaxError) });
    const initDB = jest.fn().mockResolvedValue(db0);
    const { getDB } = loadModule(initDB);

    const db = await getDB();
    await expect(db.run('SELEKT 1')).rejects.toThrow('syntax error');

    const db2 = await getDB();
    expect(initDB).toHaveBeenCalledTimes(1); // no re-open
    expect(db2).toBe(db);
  });
});
