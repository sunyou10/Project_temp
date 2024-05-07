const express = require('express');
const app = express();
const port = 3000;


app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.get('/location', (req, res) => {
    res.sendFile(__dirname+'/location.html')
});

app.get('/login', (req, res) => {
    res.write("<!DOCTYPE html>");
    res.write("<html>");
    res.write(" <body>");
    res.write(" <h1>good</h1>");
    res.write(" </body>");
    res.write("</html>");
    res.end();
})


app.get('/:id/', (req, res) => {
    res.write("<!DOCTYPE html>");
    res.write("<html>");
    res.write(" <body>");
    res.write(" <h1>Detail Page</h1>");
    res.write(" </body>");
    res.write("</html>");
    res.end();
})

app.listen(port, () => console.log(`Page open in  port: ${port}`));