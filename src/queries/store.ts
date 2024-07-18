import Store from "../models/store.ts";

const store = async () => {
    return await new Store().save();
}

export {store}