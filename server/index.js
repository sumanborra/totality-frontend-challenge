const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());
app.use(cors());

let client;
const initializeDBAndServer = async () => {
    
    const username = encodeURIComponent("sumanborra");
    const password = encodeURIComponent("Suman@8978");

   
    const uri = `mongodb+srv://${username}:${password}@suman.frnfj7m.mongodb.net/?retryWrites=true&w=majority&appName=suman`;

    client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB.....");
        app.listen(3000, ﻿() => {
            console.log('Server running on port: 3000');
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};
  
initializeDBAndServer();


const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token");
    } else {
       
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
            if (error) {
                response.status(401);
                response.send({ "Invalid JWT Token": error });
            } else {
                request.userId = payload.userId;
                next();
            }
        });
    }
};

app.post('/register', async (request, response) => {
    try {
        // connecting database database and 'collection'
        const collection = client.db('totality').collection('userdetails'); 
        const userDetails = request.body; 
        
        const { username,password } = userDetails;
        const isUserExist = await collection.find({ username }).toArray();
       console.log(isUserExist)
        if (isUserExist.length === 0) {
            const hashedPassword = await bcrypt.hash(password, 10);
            userDetails.password = hashedPassword;
            
            const result = await collection.insertOne(userDetails);
            console.log(result)
            response.status(200)
            response.send({ yourId: result.insertedId, message: "User registered successfuly" });
        } else {
            response.status(401);
            response.send({ errorMsg: 'User with this Email ID already exists' })
        }
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});

app.post('/login', async (request, response) => {
    try {
        
        const collection = client.db('totality').collection('userdetails'); 
        
        const { userName, password } = request.body;
        
        const isUserExist = await collection.findOne({ userName });
        if (!isUserExist) {
            response.status(401)
            response.send({ errorMsg: "User with this Email ID doesn't exist" });
            return;
        }
        const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);
        if (isPasswordMatched) {
            // generating JWT secret key
            const token = jwt.sign({ userName }, "MY_SECRET_TOKEN");
            response.status(200)
            response.send({ jwtToken: token, userName: isUserExist.userName });
        } else {
            response.status(401)
            response.send({ errorMsg: "Incorrect password" });
        }
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});