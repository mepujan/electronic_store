const express = require("express")
const mongo = require("mongodb").MongoClient
const app = express()
require('dotenv').config()
const url = process.env.DATABASE_URL
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const bodyParser = require('body-parser');
let db

mongo.connect(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    db = client.db("ProductCatalog")
    products = db.collection("products")
  }
)
app.use(express.json())
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("build"));

// return index.html file

app.get("/",(req,res)=>{
    res.sendFile("./build/index.html");
})

//Return a JSON object containing all the products in the database
app.get("/Products", (req, res) => {
    products.find().toArray((err, items) => {
        if (err) {
            console.error(err)
            res.status(500).json({ err: err })
            return
        }
        res.status(200).json({ 
            products: items 
        })
    })
})

//Return a JSON object containing the IDs of all the products in the database
app.get("/Products/Identifiers", (req, res) => {
    products.find().project({"_id":1}).toArray((err, items) => {
        if (err) {
            console.error(err)
            res.status(500).json({ err: err })
            return
        }
        res.status(200).json({ 
            products: items 
        })
    })
})


//Return a JSON object containing all the Product’s details in the MongoDB
app.get("/Products/:id", (req, res) => {
    products.findOne({_id : ObjectId(req.params.id)}).then((item) => {
        res.status(200).json({ 
            item
        })
    })
})

// Given the filename of the image for a product return it's static image
app.use(express.static('./public'))
    .get("/Products/images/:filename", (req, res) => {
        let filename = req.params.filename
        res.sendFile('./public/images/'+filename, { root: __dirname })
})

//Return a JSON object the specified {field} info from the Product’s details in the MongoDB
app.get("/Products/:id/:field", (req, res) => {
    field = req.params.field
    products.findOne({_id : ObjectId(req.params.id)}).then((item) => {
        let result = {}
        result[field] = item[field]
        res.status(200).send(result)
    })
})

//Based on the provided identifier, REPLACE the corresponding object in the MongoDB collection.
app.put('/Products/:id', (req,res) => {
    try{
        products.updateOne(
            {_id: ObjectId(req.params.id)}, 
            {
                $set: 
                {
                    ...req.body
                }   
            }
        )
        .then(result => {
            if(result.modifiedCount > 0){
                res.send({
                    message: "Product was updated successfully!"
                })
            }
        })
    }
    catch(e){
        res.send({
            message: "Sorry! couldn't update product"
        })
    }
    
})

//Based on the provided identifier, DELETE the corresponding object in the MongoDB collection.
app.delete("/Products/:id", (req, res) => {
    products.deleteOne(
        {
            _id : ObjectId(req.params.id)
        })
        .then(data => {
            if (!data) {
                res.status(404).send({
                    message: `Cannot delete product with id=${id}. Maybe product was not found!`
                });
            } 
            else {
                if(data.deletedCount > 0){
                    res.send({
                        message: "Product was deleted successfully!"
                    });
                }
                else{
                    res.status(404).send({
                        message: `Cannot delete product with id=${id}. Maybe product was not found!`
                    });
                }
            }
        })
        .catch(err => {
            res.status(500).send({
            message: "Could not delete product with id=" + req.params.id
        });
    })
})

//Based on the provided identifier, UPDATE the corresponding object’s FIELD in the MongoDB collection.
app.patch("/Products/:id/:field", (req, res) => {
    const field = req.params.field
    const value = req.body
    const obj = {}
    obj[field] = value[field]
    try{
        products.updateOne(
            {_id : ObjectId(req.params.id)},
            { 
                $set: obj
            }
        ).then((item) => {
            res.status(200).send(item)
        })
    }
    catch(e){
        console.log(e.message)
        res.send("Sorry! couldn't update product field")
    }
})

app.get("/Products/Page/:skip/:limit", (req, res) => {
    products.find({})
    .skip(2)
    .limit(3)
    .toArray((err, items) => {
        if (err) { 
            console.error(err)
            res.status(500).json({ err: err })
            return
        }
        res.status(200).json({ 
            products: items 
        })
    })
})


app.listen(2000, () => console.log("Server ready"))