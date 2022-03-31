const users = require('./routes/users');
const appointments = require('./routes/appointments');
const corrs = require('./middleware/corrs');
const express = require('express');
const app = express();

//Middleware
app.use(express.json());
app.use(corrs);
app.use(express.urlencoded({extended:true}));  // This will allow to accept form field values from body JSON

// Commponents...
app.use('/api/users', users);
app.use('/api/appointments', appointments);

// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
