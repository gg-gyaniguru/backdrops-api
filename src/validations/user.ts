const isValidUsername = (username: string) => {
    return username.split('').map((e) => {
        const key = e.charCodeAt(0)
        return (key >= 48 && key <= 57) || (key >= 65 && key <= 90) || (key >= 97 && key <= 122) || (key === 45) || (key === 46) || (key === 95);
    }).filter(e => !e).length === 0;
}

const isValidEmail = (email: string) => {
    return email.includes('@');
}

export {isValidUsername, isValidEmail}