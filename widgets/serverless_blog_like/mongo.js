const MongoClient = require('mongodb').MongoClient;

const uri = "mongodb+srv://<username>:<password>@<cluster_url><dbname>?retryWrites=true&w=majority";

async function getDocumentLike(docName) {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await  client.connect();
    const cmd = client.db('blog').collection('doc_like');
    res = await cmd.findOne({"docName": docName});
    if (res ==  null) {
        res = addDocumentLike(docName, 0);
    }

    client.close();
    return res;
}

async function addDocumentLike(docName, num) {
    const client = new MongoClient(uri, { useNewUrlParser: true });
    await client.connect();

    const cmd = client.db('blog').collection('doc_like');
    docObj = await cmd.findOne({"docName": docName});

    if (docObj == null) {
        docObj = {
            "docName": docName,
            "likeNum": 0
        };
    } else {
        docObj.likeNum += num;
    }

    cmd.updateOne(
        {"docName": docName},
        {$set: docObj},
        {"upsert": true},
        function(err, res) {
            if (err) {
                throw err;
            }
            // console.log("1 document updated, res: " + res);
        }
    )
    client.close()

    return docObj
}

async function test(){
    var res1 = await getDocumentLike("Algorithm");
    console.log(res1);
    var res2 = await addDocumentLike("Algorithm", 1);
    console.log(res2);
}

// test();

module.exports = {getDocumentLike, addDocumentLike}