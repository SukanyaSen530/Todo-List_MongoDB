const express = require("express");
const app = express();
const https = require('https');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _= require('lodash');

app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Insert the name of the data item, it's missing!"]
  },
});

const listSchema = {
  listname: {type: String, required: [true, "Insert the name of the data item, it's missing!"]},
  items: [itemSchema]
};

const Item = mongoose.model('item', itemSchema);
const List = mongoose.model("list", listSchema);

const item1 = new Item({
  name: "Welcome to your To-Do List"
})
const item2 = new Item({
  name: "Hit + button to add new item"
})
const item3 = new Item({
  name: "Hit <--- checkbox to delete the item"
})
const defaultItems = [item1, item2, item3];

//date
var today = new Date();
var options = {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long"
};
var day = today.toLocaleDateString("en-US", options);

//Routes
app.get("/", function(req, res) {
  Item.find({}, function(err, founditems) {
    if (founditems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (!err) {
          console.log("Successfully inserted default items to the database!");
          res.redirect("/");
        }
      })
    } else {
      res.render("list", {
        date: day,
        listTilte:"Today",
        newItems: founditems,
      })
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newListItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  })
   if(listName==="Today"){
     item.save();
     console.log("Successfully Added Item to home list");
     res.redirect("/");
   }
   else{
     List.findOne({listname: listName}, function(err, foundlist){
       foundlist.items.push(item);
       foundlist.save();
       console.log("Successfully added to custom list");
       res.redirect("/"+listName);
     })
   }

})

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const listName = req.body.list;

  if(listName==="Today"){
    Item.findByIdAndDelete(id, function(err) {
      if (!err) {
        console.log("Successfully Deleted");
        res.redirect("/");}
    });
  }
  else{
    List.findOneAndDelete({listname: listName}, { $pull: {items: {_id:id}}}, function(err, foundlist){
      if(!err){res.redirect("/"+ listName);}
    })
  }
})

app.get("/:customList", (req, res) => {
  const customList = _.capitalize(req.params.customList);
  List.findOne({listname: customList}, function(err, foundlist) {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          listname: customList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customList);
      } else {
      res.render("list", {
        date: day,
        listTilte: foundlist.listname,
        newItems: foundlist.items
      });
    }
  }
})
})

app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
