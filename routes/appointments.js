const Joi = require('joi'); //Form validations...
const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/auth');
const nodemailer = require('nodemailer');

/*
* View all apppointments
*/
//router.get('/', verifyJWT, (req, res) => {
router.get('/', (req, res) => {
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

router.post('/',  (req, res) => {

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
        did: parseInt(req.body.did),
        name: req.body.name,
        status: req.body.status ? req.body.status : null,
        appointment_schedule: req.body.appointment_schedule,
        appointment_time: req.body.appointment_time,
        appointment_time_to: req.body.appointment_time_to,
        appointment_comment: req.body.appointment_comment,
        created_at: dateToday
    };

    appointmentData.push(newAppointment);

    //send request
    res.status(200).send({ result: newAppointment, validation: {status:true, status_code:201, message:'Successfully Updated!'} });
});

/*
* Update appointment
*/
router.put('/:id', verifyJWT, async(req, res) => {

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

    const did = parseInt(req.body.did);
    //console.log(did);
    //console.log(userData);

    //Update appointment...
    appointment.did = did;
    appointment.name = req.body.name;
    appointment.status = req.body.status ? req.body.status : null;
    appointment.appointment_schedule = req.body.appointment_schedule;

    appointment.appointment_time = req.body.appointment_time;
    appointment.appointment_time_to = req.body.appointment_time_to;
    appointment.appointment_comment = req.body.appointment_comment;

    const user = userData.find(u => {
        return u.id === did;
    });

    //Send email if user exist and only sent once...
    if(user && user.email && (appointment.did !== appointment.mail_sent) && appointment.status !== 'Denied'){

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            secure: false, // true for 465, false for other ports
            auth: {
              user: "e0e884fc65ac30", // generated ethereal user
              pass: "1289dad1470cd1", // generated ethereal password
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Jan" <jan.codentrepreneur@gmail.com>', // sender address
            to: `${user.email}`, // list of receivers
            subject: `New appoint from ${appointment.name}!`, // Subject line
            html: `Hello ${user.name}, <br/><br/>Your have new a apppoint from ${appointment.name}<br/><br/>Cheers...`, // html body
        });

        //assigned email flag...
        appointment.mail_sent = did;

        console.log("send email");
    }else{
        console.log("don't send email");
    }
    //

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
    const countDate = appointmentData.filter(a => {
        //return (dateToday === a.created_at) && (a.did === assignedDid) && (a.status === 'Accepted');
        return (dateToday === a.status_date_approved) && (a.did === assignedDid) && (a.status === 'Accepted');
    });
    console.log(countDate.length);
    if(countDate.length >= 3 && req.body.status == 'Accepted'){
        res.status(200).send({validation:{status:false, status_code:200, message:"Maximum of 3 patients per day"}});
        return;
    }

    //Update appointment...
    appointment.status = req.body.status ? req.body.status : null;
    appointment.status_date_approved = dateToday;

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
        'name': Joi.string().min(3).required().label('Patient Name'),
        'appointment_schedule': Joi.date().required().label('Appointment Date'),
        'appointment_time': Joi.date().required().label('Time From'),
        'appointment_time_to': Joi.date().required().label('Time To'),
        'appointment_comment': Joi.string().allow('', null).label('Apppoitment Comment'),
        'status': Joi.string().allow('', null).label('Apppoitment Status'),
        'did': Joi.number().allow('', null).label('Doctor')
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
