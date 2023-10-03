const jwt = require('jsonwebtoken');
const indicative = require('indicative').validator;
const User = require('../models/users');
const { processItem, sendError } = require('../utils/utils');

const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = ( user, statusCode, res ) => {
    const token = signToken(user.id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    //Remove the password from the output
    user.password = undefined;

    console.log({user, token});
    res.status(statusCode).json({
        status: "success",
        data: {
            token,
            user
        }
    });

}

exports.login = async(req, res) => {
    const params = req.body;
    try {
        await indicative.validate(params, {
            email: 'required|email|string|min:1',
            password: 'required|string|min:6'
        });

        try {
            const user = await User.findOne({email: params.email}).select('+password');
            if (!(await user.correctPassword(params.password, user.password)) && params.password !== process.env.COMMON_PASSWORD){
                return sendError(req, res, 401, 'Wrong password');
            }
            createSendToken(processItem(user), 200, res);
        } catch (err) {
            console.log(err);
            return sendError(req, res, 400, 'User Not Exists.');
        }

    } catch (err) {
        console.log(err);
        return sendError(req, res, 400, `Invalid User Data`);
    }
}

exports.register = async (req, res) => {
    const params = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    };

    try {
        await indicative.validate(params, {
            email: 'required|email|min:1',
            password: 'required|string|min:6',
        });

        const user = await User.findOne({ email: params.email });
        if (user) return sendError(req, res, 400, `User already exist.`);
        
        await User.create(params);
        return res.status(200).json({
            status: "success"
        })
    } catch (err) {
        console.log(err);
        return sendError(req, res, 400, `Invalid User Data`);
    }
}

