require('dotenv').config()
const express = require('express')
const multer = require('multer')
const path = require('path')
const cors = require('cors');
const fs = require('fs');
const fsprom = fs.promises
const jimp = require('jimp')
const jwt = require('jsonwebtoken')

const app = express()
const { MongoClient, ObjectId } = require("mongodb");
const { request } = require('http');

const upload = multer({
    dest: __dirname + '/upload'
})

app.use(require('body-parser').urlencoded({ extended: false }));
app.use(express.json())
app.use('/static', express.static('upload'));

const handleError = (err, res) => {
    res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
  };

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

app.all('*', async (req, res, next) => {
    const isAuth = req.path == '/auth';
    const isOptions = req.method == 'OPTIONS';
    const isCreate = req.path == '/user/create';
    const re = new RegExp('/photos/[a-zA-Z]+')
    const isPhotosByUser = re.test(req.path)
    const skipNext = isAuth || isOptions || isCreate || isPhotosByUser;
    if (skipNext) {
        return next()
    }
    var data = undefined;
    try {
        data = await jwt.verify(req.headers.token, process.env.JWT_SECRET)
    }
    catch(e) {
        res.status(401)
            .end("Invalid token")
        return
    }
    req.headers.user = data.username
    req.headers.pass = data.password
    next()
})

// post a single photo
app.post(
    "/photos",
    upload.single("file"),
    async (req, res) => {
        const inttime = +new Date()
        const currTime = String(inttime);
        const newName = req.headers.user + '_' + currTime + '.jpeg';
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect()
        u=client.db("main").collection("users")
        const user = req.headers.user
        const pass = req.headers.pass
        const query = {username: user, password: pass}
        const q = await u.findOne(query)
        if (q == null) {
            await client.close()
            res.status(304)
                .end("User not found!")
            return
        }
        else {
            m = client.db("main").collection("media")
            const _userid = String(q._id)
            const p = {
                _userid : new ObjectId(_userid),
                name : newName,
                title : req.body.title,
                ts: inttime,
                _username: req.headers.user,
                likes: 0
            }
            await m.insertOne(p)
            await client.close()
        }
        const pname = path.extname(req.file.originalname).toLowerCase();
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, "./upload/" + newName);
        if (pname === '.jpeg' || pname === '.jpg') {
            try{
            await fsprom.rename(tempPath, targetPath)
            img = await jimp.read(targetPath);
            img.resize(512, 512);
            img.write(targetPath);
            }
            catch(err) {
                return handleError(err, res)
            }
        }
        else if(pname === '.png') {
            const pngName = req.body.id + '_' + currTime + '.png';
            const pngPath = path.join(__dirname, "./upload/" + pngName);
            try {
                await fsprom.rename(tempPath, pngPath);
                img = await jimp.read(pngPath);
                img.resize(512, 512);
                img.write(targetPath);
                await fsprom.unlink(pngPath);
            }
            catch (err) {
                return handleError(err, res);
            }
        }
        else {
            fs.unlink(tempPath, err => {
            if (err) return handleError(err, res);
            res
                .status(403)
                .contentType("text/plain")
                .end("Only .png files are allowed!");
            });
        }
        res
            .status(200)
            .contentType('text/plain')
            .end('File uploaded!')
    }
);

app.options('/photos', (req, res) => {
    res.set('Access-Control-Allow-Headers', '*')
        .status(200)   
        .contentType('text/plain')
        .end("you good bro")
})

// get a list of photos
app.get('/photos', async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect()
    u=client.db("main").collection("users")
    const query = {username: req.headers.user, password: req.headers.pass}
    const q = await u.findOne(query)
    if (q == null) {
        await client.close()
        console.log("q is null wtf")
        res.status(304)
            .end("User not found!")
        return
    }
    const id = String(q._id);
    i = client.db("main").collection("media")
    const img_query = {_userid: ObjectId(id)}
    const img_q = await i.find(img_query).sort({ts: -1})
    if(img_q == null) {
        await client.close()
        res.status(201)
            .end("No Images!")
    }
    var img_arr = await img_q.toArray()
    img_arr = img_arr.map(x => {
        return {
            'name': x.name,
            'title': x.title,
            '_id': String(x._id),
            '_userid': String(x._userid)
        }
    })
    res.
        status(200)
        .contentType('text/plain')
        .end(JSON.stringify(img_arr))
})

app.options('/photos/:username', async (req, res) => {
    res.set('Access-Control-Allow-Headers', '*')
    .status(200)   
    .contentType('text/plain')
    .end("you good bro")  
})

app.get('/photos/:username', async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect()
    i = client.db("main").collection("media")
    const img_query = {_username: req.headers._username}
    const img_q = await i.find(img_query).sort({ts: -1})
    if(img_q == null) {
        await client.close()
        res.status(201)
            .end("No Images!")
    }
    var img_arr = await img_q.toArray()
    img_arr = img_arr.map(x => {
        return {
            'name': x.name,
            'title': x.title,
            '_id': String(x._id),
            '_username': x._username
        }
    })
    res.
        status(200)
        .contentType('text/plain')
        .end(JSON.stringify(img_arr))
})

// get a list of photos
app.delete('/photos', async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect()
    u=client.db("main").collection("users")
    const query = {username: req.headers.user, password: req.headers.pass}
    const q = await u.findOne(query)
    if (q == null) {
        await client.close()
        res.status(304)
            .end("User not found!")
        return
    }
    console.log(req.headers)
    const _id = req.headers._id
    console.log(_id)
    i = client.db("main").collection("media")
    const img_query = {_id: new ObjectId(_id)}
    const img_find_q = await i.findOne(img_query)
    console.log('here')
    if(img_find_q == null) {
        await client.close()
        res.status(304)
            .end("Img not found!")
        return
    }
    const img_name = img_find_q.name
    console.log(img_name)
    const img_q = await i.deleteOne(img_query)
    if(img_q == null) {
        await client.close()
        res.status(304)
            .end("Img not deleted!")
        return
    }
    try {
        await fsprom.unlink(path.join(__dirname, 'upload', img_name));
    }
    catch(err) {
        return handleError(err, res);
    }
    res.
        status(200)
        .contentType('text/plain')
        .end('Photo deleted!')
})

app.options('/user/create', async (req, res) => {
    res.set('Access-Control-Allow-Headers', '*')
    .status(200)   
    .contentType('text/plain')
    .end("you good bro")   
})

app.post('/user/create', async (req, res) => {
    const user = req.headers.user;
    const pass = req.headers.pass;
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const u = client.db("main").collection("users")
    //check if username exists already
    const query = {username: user}
    const p = await u.findOne(query)
    if(p != null) {
        console.log(user)
        console.log(pass)
        console.log("No user with this info found!")
        res.status(304)
            .end("user already exists!")
        return
    }
    else {
        await u.insertOne({username: user, password: pass})
    }
    const data = {
        username: user,
        password: pass
    }
    const token=jwt.sign(data, process.env.JWT_SECRET)
    await client.close()
    res.status(200)
        .send(token)
})

app.options('/auth', async (req, res) => {
    console.log(req.method)
    res.set('Access-Control-Allow-Headers', '*')
        .status(200)   
        .contentType('text/plain')
        .end("you good bro")
})

app.post('/auth', async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    u=client.db("main").collection("users")
    const user = req.headers.user;
    const pass = req.headers.pass;
    const query = {username: user, password: pass}
    const q = await u.findOne(query);
    if (q == null) {
        console.log(user)
        console.log(pass)
        console.log("No user with this info found!")
        res.status(304)
            .end("user not found!")
        return
    }
    else {
        const data = {
            username: user,
            password: pass
        }
        const token=jwt.sign(data, process.env.JWT_SECRET)
        res.send(token)
    }
})

async function run() {
    const PORT = 3003
    app.listen(PORT)
}

run().catch(console.dir);