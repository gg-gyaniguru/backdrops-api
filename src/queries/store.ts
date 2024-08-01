import Store from "../models/store.ts";

type CreateStore = {
    key: number,
    unique: string
}

const store = async (store: CreateStore) => {
    return await new Store(store).save();
}

export type {CreateStore};
export {store};