//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); //require mongoose
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to mongoose using localhost port27017
mongoose.connect("mongodb://localhost:27017/todolistDB", {useUnifiedTopology: true,useNewUrlParser: true ,useFindAndModify:false});

//create the schema
const itemSchema = {
  name: String
};


//create model
const Item = mongoose.model("item",itemSchema);

//create new document using mongoosemodel
const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add new items."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//array to store these default items
const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {


  //use find() to log all the content of db

  Item.find({},(err,foundItems)=>{

    if (foundItems.length === 0) {

      //insert these items to the database using insertMany()
      Item.insertMany(defaultItems,(err)=>{
        if(err){
          console.log(err);
        }else{
          console.log("Successufully added all the items to the todolistDB" );
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});

    }

  });


});

app.get("/:customListName",(req,res)=>{
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName},(err,foundList)=>{
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        res.render("list",{listTitle: foundList.name,newListItems:foundList.items})
        console.log("Exists!");
      }
    }
  })


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;


  //create items dynamically to add to db
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, (err,foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }


});

app.post("/delete",(req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName ==="Today"){
    //to delte that item whose id we got
    Item.findByIdAndRemove(checkedItemId,(err)=>{
      if(err){
        console.log(err);
      }else{
        res.redirect("/");
        console.log("Successufully deleted the item");
      }
    })
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err,foundList)=>{
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }


})




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
