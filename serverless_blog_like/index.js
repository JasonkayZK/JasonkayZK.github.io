'use strict';
var {getDocumentLike, addDocumentLike} = require('./mongo')

exports.main_handler = async (event, context) => {
    console.log(event);
    var body = event.body;
    var jsonObj = JSON.parse(body);
    
    var resObj = {};
    var actionId = jsonObj.actionId;
    var docName = jsonObj.docName;

    if (actionId == 'get') {
        resObj = await getDocumentLike(docName);
    } else if (actionId == 'add') {
        resObj = await addDocumentLike(docName, 1);
    } else if (actionId == 'subtract') {
        resObj = await addDocumentLike(docName, -1);
    }

    return resObj;
};