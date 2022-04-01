const crypto = require('crypto');
const users = require('./routes/users');
const appointments = require('./routes/appointments');
const corrs = require('./middleware/corrs');
const express = require('express');
const app = express();

/*
* Sample test data array structure...
*/

/*
global.userData = [
    {id:1, name:'Jan', userType: 'Scheduler', email: 'jan@gmail.com', password: hashPassword('1234567')},
    {id:2, name:'Dr. Willy Ong', userType: 'Doctor', email: 'willyong@gmail.com', password: hashPassword('1234567')},
    {id:3, name:'Dr. Jane', userType: 'Doctor', email: 'jane@gmail.com', password: hashPassword('1234567')},
    {id:4, name:'Dr. Jan', userType: 'Doctor', email: 'drjan@gmail.com', password: hashPassword('1234567')},
    {id:5, name:'Dr. Jack', userType: 'Doctor', email: 'drjack@gmail.com', password: hashPassword('1234567')},
];

global.appointmentData = [
    {id:1, did: 2, name:'Jan', status: 'Accepted', appointment_schedule: '2022-03-08T19:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:2, did: 2, name:'Devy', status: '', appointment_schedule: '2022-03-03T16:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:3, did: 2, name:'James', status: 'Accepted', appointment_schedule: '2022-03-10T20:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:4, did: 4, name:'Gohan', status: 'Denied', appointment_schedule: '2022-03-17T14:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:5, name:'Inday', appointment_schedule: '2022-03-23T20:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:6, did: 2, name:'Jameson', status: 'Denied', appointment_schedule: '2022-03-29T16:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:7, did: 3, name:'Paul', status: 'Accepted', appointment_schedule: '2022-03-11T16:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
];
*/

global.userData=[];
global.appointmentData=[];

//Middleware
app.use(express.json());
app.use(corrs);
app.use(express.urlencoded({extended:true}));  // This will allow to accept form field values from body JSON

// Commponents...
app.use('/api/users', users);
app.use('/api/appointments', appointments);

/*
* Simple hashPassword
*/
function hashPassword(password){
    const md5sum = crypto.createHash('md5');
    return md5sum.update(password).digest('hex');
}

// PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
