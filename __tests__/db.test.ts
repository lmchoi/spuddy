// Each test gets a fresh module (and fresh _dbPromise singleton) via isolateModules.

const makeDB = () => ({ run: jest.fn(), all: jest.fn() });

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

  it('re-opens after initDB() rejects', async () => {
    const initError = new Error('disk I/O error');
    const good = makeDB();
    const initDB = jest.fn()
      .mockRejectedValueOnce(initError)
      .mockResolvedValueOnce(good);
    const { getDB } = loadModule(initDB);

    await expect(getDB()).rejects.toThrow('disk I/O error');

    const db = await getDB();
    expect(initDB).toHaveBeenCalledTimes(2);
    expect(db).toBe(good);
  });
});
