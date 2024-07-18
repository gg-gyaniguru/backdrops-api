import Cryptr from "cryptr";
import random from "./random.ts";

const secret = random();

const cryptr = new Cryptr(secret);

const encrypt = (input: string): string => {
    return cryptr.encrypt(input);
}

const decrypt = (encrypt: string): string => {
    return cryptr.decrypt(encrypt);
}

export {encrypt, decrypt}