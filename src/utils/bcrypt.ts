import bcrypt from 'bcrypt';

const rounds = 10;

const encrypt = async (password: string) => {
    return await bcrypt.hash(password, rounds);
}

const compare = async (password: string, encrypt: string,) => {
    return await bcrypt.compare(password, encrypt);
}

export {encrypt, compare};

/*
export default {
    encrypt: async (password: string) => {
        return await bcrypt.hash(password, rounds);
    },
    compare: async (password: string, encrypt: string) => {
        return await bcrypt.compare(password, encrypt);
    }
}*/
