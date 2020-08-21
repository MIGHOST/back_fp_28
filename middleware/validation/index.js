

function userValidation (req, res, next) {
    const { email, password, name } = req.body;
    const emailValid = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const passValidNumber = /(?=.*[0-9])[0-9a-zA-Z!@#$%^&*]/g;
    const passValidSymbol = /(?=.*[!@#$%^&*])[0-9a-zA-Z!@#$%^&*]/g;
    const passValidString = /(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z!@#$%^&*]/g;
    const passValidLength = /[0-9a-zA-Z!@#$%^&*]{6,}/g;
    const isEmailValid = emailValid.test(email);
    const isPassValidNumber = passValidNumber.test(password);
    const isPassValidSymbol = passValidSymbol.test(password);
    const isPassValidString = passValidString.test(password);
    const isPassValidLength = passValidLength.test(password);
    if (!isEmailValid) {
        return res.status(400).send({message: "Email not valid"})
    } else if (!isPassValidNumber || !isPassValidSymbol || !isPassValidString || !isPassValidLength) {
        return res.status(400).send({message: `Password is not valid. Must have: ${isPassValidNumber ? "" : "one or more number; "}${isPassValidString ? "" : "two or more letter - upper and lower; "}${isPassValidSymbol ? "" : "one of special symbol; "}${isPassValidLength ? "" : "password length is more then 6 symbol;"}`})
    } else if (name !== undefined) {
        const isNameValid = name.length >= 3;
        if(!isNameValid){
            return res.status(400).send({message: "Name must be more then 3 letters"})
        }
    } else {
        next()
    }
}

exports.userValidation = userValidation;