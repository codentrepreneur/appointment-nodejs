const Joi = require('joi'); //Form validations...
const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/auth');

/*
* Data Array Structure...
*/

const appointmentData = [
    {id:1, did: 2, name:'Jan', status: 'Accepted', appointment_schedule: '2022-03-08T19:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:2, did: 2, name:'Devy', status: '', appointment_schedule: '2022-03-03T16:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:3, did: 3, name:'James', status: 'Accepted', appointment_schedule: '2022-03-10T20:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:4, did: 4, name:'Gohan', status: 'Denied', appointment_schedule: '2022-03-17T14:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:5, name:'Inday', appointment_schedule: '2022-03-23T20:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:6, did: 2, name:'Jameson', status: 'Denied', appointment_schedule: '2022-03-29T16:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
    {id:7, did: 3, name:'Paul', status: 'Accepted', appointment_schedule: '2022-03-11T16:00:00.000Z', created_at: '2022-03-01T19:00:00.000Z'},
];


//const appointmentData = [];


/*
* View all apppointments
*/
router.get('/',  (req, res) => {
    res.status(200).send({ result: appointmentData, validation: {status:true, message:'Successfully Loaded!'} });
});


/*
* Filter by date range...
*/
router.post('/dateFilter', verifyJWT, (req, res) => {

    //get requests...
    const startDate = new Date(String(req.body.startDate)).getTime();
    const endDate = new Date(String(req.body.endDate)).getTime();
    const docfilter = parseInt(req.body.docfilter);

    //filter by date...
    let appointments = appointmentData.filter(a => {
        var time = new Date(a.appointment_schedule).getTime();
        if(startDate && endDate){
          return (startDate <= time && time <= endDate);
        }else if(!startDate && endDate){
          return (time <= endDate);
        }else if(startDate && !endDate){
          return (startDate <= time);
        }
    });

    //Filter by doctor...
    if(docfilter){
        let appointmentsFilter = !req.body.startDate && !req.body.endDate ? appointmentData : appointments;
        appointments = appointmentsFilter.filter(a => {
            return parseInt(a.did) === docfilter;
        });
    }

    //load all if empty request
    appointments = req.body.startDate || req.body.endDate || req.body.docfilter ? appointments : appointmentData;

    res.status(200).send({ result: appointments, validation: {status:true, message:'Successfully Loaded!'} });
});

/*
* Add appointment
*/
router.post('/', (req, res) => {

    // Validation...
    const {error} = validateAppointment(req.body);
    if(error){
        return res.status(200).send({validation:{status:false, status_code:200, message:error.details[0].message}})
    }

    //Check maximum appointments per day...
    const dateObjToday = new Date();
    const dateToday = dateObjToday.setHours(0,0,0,0); //Todays Date...

    const countDate = appointmentData.filter(a => {
        return dateToday === a.created_at;
    });

    //Display validation for maximum appointments...
    if(countDate.length >= 5){
        return res.status(200).send({validation:{status:false, status_code:200, message:"Can no longer accept booking! Maximum of 5 booked per day!"}})
    }

    //Insert new appointment...
    const newAppointment = {
        id: appointmentData.length + 1,
        did: req.body.did,
        name: req.body.name,
        status: req.body.status ? req.body.status : null,
        appointment_schedule: req.body.appointment_schedule,
        created_at: dateToday
    };

    appointmentData.push(newAppointment);

    //send request
    res.status(201).send({ result: newAppointment, validation: {status:true, status_code:201, message:'Successfully Updated!'} });
});

/*
* Update appointment
*/
router.put('/:id', verifyJWT, (req, res) => {

    //Check if exist...
    const appointment = checkAppoitmentExist(req.params.id);
    if(!appointment){
        res.status(200).send({validation:{status:false, status_code:200, message:'Appointment not found!'}});
        return;
    }

    // Validation...
    const {error} = validateAppointment(req.body);
    if(error){
        return res.status(200).send({validation:{status:false, status_code:200, message:error.details[0].message}});
    }

    //Update appointment...
    appointment.did = req.body.did;
    appointment.name = req.body.name;
    appointment.status = req.body.status ? req.body.status : null;
    appointment.appointment_schedule = req.body.appointment_schedule;

    res.status(200).send({ result: appointment, validation: {status:true, message:'Successfully Updated!'} });
});

/*
* Update appointment status
*/
router.put('/status/:id', verifyJWT,(req, res) => {

    //Check if exist...
    const appointment = checkAppoitmentExist(req.params.id);
    if(!appointment){
        res.status(200).send({validation:{status:false, status_code:200, message:'Appointment not found!'}});
        return;
    }

    //Check maximum of 3 accept appointments per doctors.
    const assignedDid = appointment.did;
    const dateObjToday = new Date();
    const dateToday = dateObjToday.setHours(0,0,0,0); //Todays Date...
    console.log(assignedDid);

    const countDate = appointmentData.filter(a => {
        return dateToday === a.created_at;
    });


    //Update appointment...
    appointment.status = req.body.status ? req.body.status : null;

    res.status(200).send({ result: appointment, validation: {status:true, message:'Successfully Updated!'} });
});


/*
* View single appointment
*/
router.get('/:id', verifyJWT, (req, res) => {

    //if appointment exist...
    const appointment = checkAppoitmentExist(req.params.id);
    if(!appointment){
        res.status(200).send({validation: {status:false, status_code:200, message:'Appointment not found!'} });
        return;
    }

    //return appointment...
    res.status(200).send({result:appointment, validation: {status:true, message:'Successfully loaded!'} });
});

/*
* Delete Appointment
*/
router.delete('/:id', verifyJWT, (req, res) => {

    //Check if exist...
    const appointment = checkAppoitmentExist(req.params.id);
    if(!appointment){
        res.status(200).send({validation: {status:false, status_code:200, message:'Appointment not found!'} });
        return;
    }

    //get index and delete...
    const index = appointmentData.indexOf(appointment);
    appointmentData.splice(index, 1);

    res.status(200).send({result:appointment, validation: {status:true, message:'Successfully Deleted!'} });
});

/*
* Function validator
*/
function validateAppointment(appointment){
    const rules = {
        'name': Joi.string().min(3).required(),
        'appointment_schedule': Joi.date().required(),
        'status': Joi.string().allow('', null),
        'did': Joi.number()
    };
    return Joi.validate(appointment, rules);
}

/*
* Function check item if exist
*/
function checkAppoitmentExist(param_id){
    const appointment = appointmentData.find(a => a.id === parseInt(param_id));
    return appointment;
}

module.exports = router;
