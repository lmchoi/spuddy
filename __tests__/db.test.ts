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
