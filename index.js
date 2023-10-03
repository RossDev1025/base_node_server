const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose  = require('mongoose');
const PORT = process.env.PORT || 8001;

const app = express();

const MongoUrl = process.env.DEV === "true" ? process.env.MONGODB_URL_DEV : process.env.MONGODB_URL_PROD;

mongoose.connect(MongoUrl).then( () => console.log(`DB connected to ${MongoUrl}`));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10Kb" }));
app.use(express.urlencoded({ extended: true }));

//Data sanitization against NOSQL query injection and xss
app.use(mongoSanitize(), xss());

//Prevents parameter pollution
app.use(
    hpp({
        whitelist: [
        "duration",
        "ratingsQuantity",
        "ratingsAverage",
        "maxGroupSize",
        "difficulty",
        "price",
        ],
    })
);

app.get('/', (req, res) => {
    res.json({success: true});
})

app.use("/api/v1", require('./routes'));
app.use("/*", (req, res) => {
    res.json({success: true});
} )
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
