/* ELEMENTE VARIABILE NECESARE */
cookieParser=require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const session = require('express-session');
const app = express();
const port = 6789;
const fs = require('fs').promises;

/* OBIECTE PENTRU A MEMORA INFORMATIILE DESPRE TENTATIVELE DE ACCESS */
const accessAttempts = {}; 
var loginAttempts = {};

/* OBIECT PENTRU A STOCA ADRESELE IP BLOCATE SI TIMPUL DE BLOCARE */
let blockedIPs = [];

/* CHESTIONAR VARIABILE */
var listaIntrebari =[];
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
}));

/* DACABASE VARIABILE */
var mysql = require('mysql');
var listaProduseDB=[]


/* UTIL  */

/* Funcție pentru blocarea accesului pentru o adresă IP */
function blockIP(ipAddress, blockTime) {
  blockedIPs[ipAddress] = Date.now() + blockTime;
}

/* Functie pentru verificarea resurselor disponibile (folosita in blocarea IP-ului care acceseaza resurse innexistente) */
function isResourceExisting(requestedResource) {
  const existingRoutes = ['/', '/autentificare', '/deautentificare', '/verificare-autentificare', '/admin', '/chestionar', '/rezultat-chestionar', '/creare-bd', '/incarcare-bd', '/adaugare_cos', '/vizualizare_cos']; // Example list of existing routes in your application
  return existingRoutes.includes(requestedResource);
}

/* Functia care calculeaza scorul la Quiz-ul din L10 */
function calculeazaScor(raspunsuri, intrebari) {
    let scor = 0;
    for (let i = 0; i < intrebari.length; i++) {
      if (raspunsuri['q' + (i + 1)] == intrebari[i].corect) {
        scor++;
      }
    }
    return scor;
  }

/*  Functie care returneaza raspunsurile corecte si intrebarile aferente (folosita in pagina de raspunsuri corecte) */
function getQuestionsAndAnswers(Intrebari) {
    const result = Intrebari.map(item => {
      const question = item.intrebare;
      const correctAnswer = item.variante[item.corect];
      return `${question}:${correctAnswer}`;
    });
    return result;
  }
 
/* Functie care preia intrebarile din fisier */
async function citesteIntrebarileDinFisier() {
  const data = await fs.readFile('intrebari.json');
  return JSON.parse(data);
  }

/*Functie care preia utilizatorii din fisier */
async function citesteUtilizatoriDinFisier() {
    const data = await fs.readFile('utilizatori.json');
    return JSON.parse(data);
    }

/* Functie care preia produsele din baza de date pentru a fi randate pe pagina principala */
function RandeazaProduseDB(conexiuneDB) {
      const queryDB = "SELECT id_prod, nume, pret FROM produse";
    
      conexiuneDB.query(queryDB, function (err, rows) {
        if (err) throw err;
    
        rows.forEach(function (row) {
          listaProduseDB.push([row.id_prod, row.nume, row.pret]);
        });
      });
    }

/* Functie care imi creeaza un dictionar spre a contoriza pentru fiecare utilizator introdus numarul de logari esuate */
function createLoginAttemptsDictionary(utilizatori) {
      
      for (const item of utilizatori) {
        const utilizator = item.utilizator;
        
        if (!loginAttempts.hasOwnProperty(utilizator)) {
          loginAttempts[utilizator] = 0;
        }
        
      }
      console.log(loginAttempts)
    }
    

/* END UTIL  */

app.set('view engine', 'ejs');
const path = require('path');
const { use } = require('express/lib/application');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  const clientIP = req.ip; // Get the IP address of the client
  const requestedResource = req.path; // Get the requested resource path

 // Check if the access attempt has already been recorded
 if (accessAttempts.hasOwnProperty(clientIP)) {
  const attempts = accessAttempts[clientIP];
  const lastAttemptTime = attempts[attempts.length - 1];

  // Check if the time elapsed since the last attempt is within a specific threshold (e.g., 1 minute)
  const elapsedTime = Date.now() - lastAttemptTime;
  const blockTime = 15000; // 15 minute in milliseconds

  if (elapsedTime < blockTime) {
    // Block access for the client IP only if the requested resource does not exist
    if (!isResourceExisting(requestedResource)) { // Implement this function to check if the resource exists
      blockIP(clientIP, blockTime);
      console.log('Access blocked for IP:', clientIP);
      return res.sendStatus(403); // Return a 403 Forbidden status
    }
  }
}

// Add the current access attempt to the attempts history
if (!accessAttempts.hasOwnProperty(clientIP)) {
  accessAttempts[clientIP] = [];
}
accessAttempts[clientIP].push(Date.now());

  // Check if the access attempt is for the login route
  if (requestedResource === '/verificare-autentificare') {
    const { username, password } = req.body;

    // Check if the user is already blocked
    if (loginAttempts[username] > 2) {
      // Set the blocking time to 15 minutes from now
      const blockTime = Date.now() + 15000;
      blockedIPs[clientIP] = blockTime;

      console.log('Access blocked for IP:', clientIP);

      return res.sendStatus(403); // Return a 403 Forbidden status
    }
      // Check if the user exceeded the maximum allowed login attempts
      if (loginAttempts[username] > 2) {
        // Set the blocking time to 15 minutes from now
        const blockTime = Date.now() + 15000;
        blockedIPs[clientIP] = blockTime;

        console.log('Access blocked for IP:', clientIP);
        loginAttempts[username] =0;
        return res.sendStatus(403); // Return a 403 Forbidden status
      }
    
  }

  next(); // Continue processing the request
});

async function startServer() {
    listaIntrebari = await citesteIntrebarileDinFisier();
    utilizatori = await citesteUtilizatoriDinFisier();
   createLoginAttemptsDictionary(utilizatori);
// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res


app.get('/', (req, res) => {
  const clientIP = req.ip; // Get the IP address of the client
  // Process the IP address or perform any necessary actions 
   // Check if the IP address is blocked
  if (blockedIPs.hasOwnProperty(clientIP)) {
    const blockExpirationTime = blockedIPs[clientIP];

    // Check if the block has expired
    if (blockExpirationTime > Date.now()) {
      console.log('Access blocked for IP:', clientIP);
      return res.sendStatus(403); // Return a 403 Forbidden status
    } else {
      // Unblock the IP address since the block has expired
      delete blockedIPs[clientIP];
    }
  }

  if (req.session.username && req.session.username.nume) {
    console.log("am numele "+req.session.username.nume)
    console.log(listaProduseDB.length)
    console.log(listaProduseDB[0])
    if(listaProduseDB.length >= 0)
    {
      console.log("am lista cu dim "+listaProduseDB.length)
      res.render('index', { role: req.session.username.type , username: req.session.username.nume, listaProduseDB: listaProduseDB  });

    }
    else{
      console.log("lista goala identificata")
      res.render('index', {role: req.session.username.type, username: req.session.username.nume, listaProduseDB:  undefined});
    }
  } else {
    if(listaProduseDB.length >= 0)
    {
      console.log("am lista cu dim "+listaProduseDB.length)
      res.render('index', {role:undefined, username: undefined, listaProduseDB: listaProduseDB  });

    }
    else{
      console.log("lista goala identificata")
      res.render('index', { role:undefined, username: undefined, listaProduseDB:  undefined});
    }
  }
});

app.get('/admin', (req, res) => {
  res.render('admin', {username: req.session.username.nume});
});

app.post('/admin', (req, res) => {
  const { productName, price } = req.body;

  // Validate the form data
  const con = mysql.createConnection({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "password",
    database: "cumparaturi" // Specify the database name
  });

  con.connect(function(err) {
    if (err) {
      console.error("Connection error:", err);
      throw err;
    }

    console.log("Connected!");

    const sql = 'INSERT INTO produse (nume, pret) VALUES (?, ?)';
    con.query(sql, [productName, price], (err, result) => {
      if (err) {
        console.error("Error adding product:", err);
        // Handle the error and send an appropriate response to the client
        res.status(500).send("Error adding product");
        return;
      }

      console.log("Product added:", result);
      // Redirect or send a success response to the client
      res.redirect('/');
    });

    con.end(); // Close the database connection
  });
});


app.get('/autentificare', (req, res) => {
    // let mesajEroare = req.cookies.mesajEroare || ""; // Default value is an empty string if the cookie doesn't exist
    // res.clearCookie('mesajEroare'); // Clear the cookie after retrieving its value
    let mesajEroare = req.session.mesajEroare || '';
    req.session.mesajEroare = ''; 
    res.render('autentificare', { mesajEroare });
});
app.post('/deautentificare', (req, res) => {
  // Stergeți variabila 'username' din sesiune
  req.session.username = undefined;
  res.redirect('/');
});


app.post('/verificare-autentificare', (req, res) => {
  let username = req.body['username'];
  let password = req.body['password'];

  let utilizatorGasit = utilizatori.find((utilizator) => {
    return utilizator.utilizator === username && utilizator.parola === password;
  })
  if (utilizatorGasit) {
    req.session.username = {
      nume: utilizatorGasit.utilizator,
      email: utilizatorGasit.email,
      type: utilizatorGasit.rol
    };
    res.redirect('/');
  } else {
    loginAttempts[username]+=1;
    req.session.mesajEroare = 'Utilizator sau parolă greșite!';
    res.redirect('/autentificare');
  }

});


// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {  
   if (req.session.username && req.session.username.nume) {
    res.render('chestionar', { username: req.session.username.nume, intrebari: listaIntrebari });
  } else {
    res.render('chestionar',{intrebari: listaIntrebari });
  }
});

app.post('/rezultat-chestionar', (req, res) => {
    const raspunsuriCorecte = getQuestionsAndAnswers(listaIntrebari);
    const scor = calculeazaScor(req.body, listaIntrebari);
    if (req.session.username && req.session.username.nume) {
      res.render('rezultat-chestionar', { username: req.session.username.nume, scor: scor , raspunsuriCorecte : raspunsuriCorecte });
    } else {
      res.render('rezultat-chestionar', { scor: scor , raspunsuriCorecte : raspunsuriCorecte });
    }
});
app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
  });

//LAB 12
app.get('/creare-bd',(req,res) =>{

  const con = mysql.createConnection({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "password",
    database: "cumparaturi" // Specify the database name

  });
  
  
  console.log("Conecting...")
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    con.query("CREATE DATABASE IF NOT EXISTS cumparaturi",function(err, result){
      if (err) throw err;
      console.log("Database created");
    });

    var use_database="USE CUMPARATURI"
    con.query(use_database, function (err, result) 
    {
      if (err) throw err;
      console.log("Utilizez baza de date CUMPARATURI!");
    });
  
    var queryDB = "CREATE TABLE IF NOT EXISTS produse (id_prod int AUTO_INCREMENT PRIMARY KEY ,nume VARCHAR(25), pret VARCHAR(25))";
    con.query(queryDB, function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
  });
  res.redirect('/');
});
 

 // Rută pentru încărcarea bazei de date
 app.post('/incarcare-bd',(req,res) =>{
  const con = mysql.createConnection({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "password"
  });
  

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    var use_database="USE CUMPARATURI"
    con.query(use_database, function (err, result) 
    {
      if (err) throw err;
      console.log("Utilizez baza de date CUMPARATURI!");
    });

   listaProduseDB =[]

    RandeazaProduseDB(con);
    console.log("LISTA PRODUSE: ", listaProduseDB);


  });
  res.redirect('/');
});

//L12 TEMA2
app.post('/adaugare_cos',(req, res) => {
  console.log(req.body.id);
  const productId = req.body.id; // Retrieve the product ID from the request body

  const con = mysql.createConnection({
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "password",
    database: "cumparaturi" // Specify the database name
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");

    var queryDB = "SELECT id_prod, nume, pret FROM produse WHERE id_prod = ?";
    con.query(queryDB, [productId], function (err, result) {
      if (err) throw err;
      console.log("Result:", result);

      // Check if a product with the given ID was found
      if (result.length > 0) {
        const product = result[0]; // Get the first product from the result
        const cartItem = [product.id_prod, product.nume, product.pret];

        // Add the cart item to the cartItems array in the session
        if (!req.session.cartItems) {
          req.session.cartItems = [];
        }
        req.session.cartItems.push(cartItem);

        console.log('Added to cart:', cartItem);
        console.log('Cart items:', req.session.cartItems);
      } else {
        console.log('Product not found');
      }

      res.redirect('/');
    });
  });
});



app.get('/vizualizare_cos', (req, res) => {

  if (req.session.username && req.session.username.nume) {
    res.render('vizualizare_cos', { username: req.session.username.nume, cos : req.session.cartItems });
  }
  else{
    res.render('vizualizare_cos', { username: undefined, cos : req.session.cartItems });
  }
});


}


startServer()