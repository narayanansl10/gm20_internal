const express = require('express');
const router = express.Router();
const Registration = require('../models/registration');
const User = require('../models/user');
const Event = require('../models/event');
const Team = require('../models/team');
const Certificate = require('../models/certificate');
const TeamMember = require('../models/team_member');
const College = require('../models/college');
var ObjectId = require('mongoose').Types.ObjectId;

router.get('/registeredEvents/:id/:type', (req, res) => {
    Registration.find({
        user_id: req.params.id
    }).populate('event_id').populate({
        path: 'event_id',
        populate: {
            path: 'category_id'
        }
    }).populate({
        path: 'event_id',
        populate: {
            path: 'department_id'
        }
    }).exec((err, docs) => {
        if (err) {
            res.json({
                error: true,
                msg: err
            })
        } else {
            docs = docs.filter((doc) => {
                return doc.event_id.category_id.name == req.params.type
            })
            ids = [];
            docs.forEach((doc) => {
                ids.push(doc.event_id._id)
            })
            res.json({
                error: false,
                msg: ids,
                doc: docs
            })
        }
    })
});

router.post('/newTeamEventRegistration', (req, res) => {
    if (req.body.position === "leader") {
        let newTeam = new Team({
            name: req.body.name,
            user_id: req.body.user_id
        })
        newTeam.save((err, res1) => {
            if (err) {
                res.json({
                    error: true,
                    msg: err
                })
            } else {
                Team.find({
                    name: req.body.name
                }, (err, res2) => {
                    let newTeamMember = new TeamMember({
                        user_id: req.body.user_id,
                        team_id: res2[0]._id
                    })
                    newTeamMember.save((err, res3) => {
                        if (err) {
                            res.json({
                                error: true,
                                msg: err
                            })
                        } else {
                            let newRegistration = new Registration({
                                event_id: req.body.event_id,
                                user_id: req.body.user_id,
                                team_id: res2._id,
                                registration_type: "Team",
                                participation: "Absent",
                                status: "Not Confirmed"
                            })
                            newRegistration.save((err, res4) => {
                                if (err) {
                                    res.json({
                                        registered: false,
                                        msg: err
                                    });
                                } else {
                                    res.json({
                                        registered: true,
                                        msg: "Team Leader registered sucessfully"
                                    })
                                }
                            });
                        }
                    })
                })
            }
        });
    } else {
        Team.find({
            name: req.body.name
        }, (err, res1) => {
            if (err) {
                res.json({
                    error: true,
                    msg: err
                });
            } else {
                let newTeamMember = new TeamMember({
                    team_id: res1[0]._id,
                    user_id: req.body.user_id
                })
                //console.log(newTeamMember);
                newTeamMember.save((err, res2) => {
                    if (err) {
                        res.json({
                            error: true,
                            msg: err
                        })
                    } else {
                        let newRegistration = new Registration({
                            event_id: req.body.event_id,
                            team_id: res1._id,
                            user_id: req.body.user_id,
                            registration_type: "Team",
                            participation: "Absent",
                            status: "Not Confirmed"
                        });
                        newRegistration.save((err, res3) => {
                            if (err) {
                                res.json({
                                    registered: false,
                                    msg: err
                                })
                            } else {
                                res.json({
                                    registered: true,
                                    msg: "Team Member Registered Sucessfully"
                                })
                            }
                        })
                    }
                })
            }
        });
    }
});


router.get('/getRegistrations/:id/:type', (req, res) => {
    Registration.find({
        user_id: req.params.id
    }).populate('event_id').populate('event_id').populate({
        path: 'event_id',
        populate: {
            path: 'category_id'
        }
    }).populate({
        path: 'event_id',
        populate: {
            path: 'category_id'
        }
    }).then((docs) => {
        docs = docs.filter((doc) => {
            if (doc.event_id.category_id.name == req.params.type) {
                return true;
            } else {
                return false;
            }
        });
        res.json(docs);
    })
})

router.get('/checkRegistration/:event_id/:user_id', (req, res) => {
    Registration.countDocuments({
        user_id: req.params.user_id,
        event_id: req.params.event_id
    }, (err) => {
        if (err) {
            res.json({
                error: true,
                msg: err
            })
        }
    }).then((docs) => {
        if (docs != 0) {
            res.json({
                error: false,
                registered: true,
                msg: 'Already Registered!'
            })
        } else {
            Registration.find({
                user_id: req.params.user_id,
                event_id: {
                    $ne: req.params.event_id
                }
            }).populate({
                path: 'event_id',
                populate: {
                    path: 'category_id'
                }
            }).then((newDocs) => {
                Event.findById(req.params.event_id).then((records) => {
                    if (newDocs.length == 0) {
                        res.json({
                            error: false,
                            registered: false,
                            msg: 'You can Register'
                        })
                    } else if (records.start_time == newDocs[0].event_id.start_time) {
                        res.json({
                            error: false,
                            registered: true,
                            msg: 'Cannot Register. You have a parallel Event'
                        })
                    } else {
                        res.json({
                            error: false,
                            registered: false,
                            msg: 'You can Register'
                        })
                    }
                })
            })
        }
    })
});


router.post('/newWorkshopRegistration', (req, res) => {

    Event.find({
        _id: req.body.event_id
    }).exec((findError, findDocs) => {
        Registration.countDocuments({
            event_id: req.body.event_id
        }, (countError, count) => {
            if (count < findDocs[0].max_limit) {
                let newRegistration = new Registration({
                    event_id: req.body.event_id,
                    user_id: req.body.user_id,
                    registration_type: req.body.registration_type,
                    participation: 'Absent',
                    status: 'Not Confirmed'
                })
                newRegistration.save((err, doc) => {
                    if (err) {
                        res.json({
                            error: true,
                            msg: err
                        })
                    } else {
                        res.json({
                            error: false,
                            msg: 'Successfully Registered!'
                        })
                    }
                });
            } else {
                res.json({
                    error: false,
                    msg: 'Workshop Maximum Limit Reached!'
                })
            }
        })
    })
});


router.post('/newEventRegistration', (req, res) => {
    if (!ObjectId.isValid(req.body.user_id))
        return res.status(400).send(`NO RECORD WITH GIVEN ID : ${req.params.id}`);
    Registration.countDocuments({
        user_id: req.body.user_id,
        event_id: req.body.event_id
    }).then((count) => {
        if (count != 0) {
            res.json({
                error: true,
                msg: 'Already Registered!'
            })
        } else {
            let newRegistration = new Registration({
                user_id: req.body.user_id,
                event_id: req.body.event_id,
                registration_type: req.body.registration_type,
                participation: 'Absent',
                status: 'Not Confirmed'
            })
            newRegistration.save((err, doc) => {
                if (err) {
                    res.json({
                        error: true,
                        msg: err
                    })
                } else {
                    res.json({
                        error: false,
                        msg: 'Successfully Registered!'
                    })
                }
            });
        }
    })
});

router.post('/newEventRegistrationOffline', (req, res) => {
    if (!ObjectId.isValid(req.body.user_id))
        return res.status(400).send(`NO RECORD WITH GIVEN ID : ${req.params.id}`);
    Registration.countDocuments({
        user_id: req.body.user_id,
        event_id: req.body.event_id
    }).then((count) => {
        if (count != 0) {
            res.json({
                error: true,
                msg: 'Already Registered!'
            })
        } else {
            let newRegistration = new Registration({
                user_id: req.body.user_id,
                event_id: req.body.event_id,
                registration_type: req.body.registration_type,
                participation: req.body.participation,
                status: req.body.status
            })
            newRegistration.save((err, doc) => {
                if (err) {
                    res.json({
                        error: true,
                        msg: err
                    })
                } else {
                    res.json({
                        error: false,
                        msg: 'Registration successfull.'
                    })
                }
            });
        }
    })
});

router.post('/delete/:id', (req, res) => {
    Registration.findByIdAndRemove(req.params.id, (err, docs) => {
        if (err) {
            res.json({
                error: true,
                msg: 'Unable to cancel your registration. Try again'
            })
        } else {
            res.json({
                error: false,
                msg: 'Registration removed!'
            })
        }
    })
});

//Don't Understand whether this code stands for attendance or certificate.
//If for certificate or attendance need not be updated online then remove this.
//Else SHOULD BE CHANGED !!
router.post('/update/:id', (req, res) => {
    if (!ObjectId.isValid(req.params.id))
        return res.status(400).send(`NO RECORD WITH GIVEN ID : ${req.params.id}`);
    var newParticipation = {
        participation: req.body.participation
    };

    Registration.findByIdAndUpdate(req.params.id, {
        $set: newParticipation
    }, {
            new: true
        }, (err, docs) => {
            if (!err) {
                Registration.findById(req.params.id, (err, doc) => {
                    Certificate.find({
                        user_id: doc.user_id
                    }).exec((certErr, certDoc) => {
                        if (certDoc.length == 0) {
                            let newCertificate = new Certificate({
                                user_id: doc.user_id,
                                event_id: doc.event_id,
                                written: false,
                                issued: false
                            });
                            newCertificate.save((err, doc) => {
                                if (err) {
                                    res.json({
                                        error: true,
                                        msg: 'Failed to Create Certficate Entry' + err
                                    });
                                } else {
                                    res.json({
                                        error: false,
                                        msg: 'Attendance Updated ,Certificate should be written. Check Certificate Table'
                                    });
                                }
                            });
                        } else {
                            res.json({
                                error: false,
                                msg: 'Attendance updated ,Certificate need not be written.'
                            })
                        }
                    })
                })
            } else {
                res.json({
                    error: true,
                    msg: "Failed To Update Attendance" + err
                });
            }
        })
});

router.get('/userRegisteredEvents/:id/:type', (req, res) => {
    Registration.find({
        user_id: req.params.id
    }).populate('event_id').populate({
        path: 'event_id',
        populate: {
            path: 'category_id'
        }
    }).populate({
        path: 'event_id',
        populate: {
            path: 'department_id'
        }
    }).exec((err, docs) => {
        if (err) {
            res.json({
                error: true,
                msg: err
            })
        } else {
            docs = docs.filter((doc) => {
                return doc.event_id.category_id.name == req.params.type
            })
            res.json({
                error: false,
                msg: docs
            })
        }
    })
})

router.get('/events/:id', function (req, res, next) {
    Registration.find({
        event_id: req.params.id
    }).populate({
        path: 'user_id',
        populate: {
            path: 'department_id'
        }
    }).populate({
        path: 'user_id',
        populate: {
            path: 'year_id'
        }
    }).populate({
        path: 'user_id',
        populate: {
            path: 'degree_id'
        }
    }).populate('event_id').exec((err, docs) => {
        if (err) {
            res.json({
                error: true,
                msg: err
            });
        } else {
            res.json(docs);
        }
    });
});


router.get('/:email', function (req, res, next) {
    User.getUserByEmailId(req.params.email, (err, docs) => {
        if (err) {
            res.json({
                error: true,
                msg: err
            });
        } else {
            res.json(docs);
        }
    });
});

router.get('/getUserEvents/:id', function (req, res, next) {
    // Registration.find({
    //     user_id: req.params.id
    // }).populate('event_id').exec(function (err, docs) {
    //     if (err) {
    //         res.json({
    //             error: true,
    //             msg: 'NO Events'
    //         });
    //     } else {
    //         res.json({
    //             error: false,
    //             msg: docs
    //         });
    //     }
    // });
});



router.get('/getEvent/:id', function (req, res, next) {
    Event.find({
        _id: req.params.id
    }, function (err, docs) {
        if (err) {
            res.json({
                error: true,
                msg: err
            })
        } else {
            res.json(docs);
        }
    })
});


router.get('/checkEventRegistrationStatus/:event_id/:user_id', function (req, res) {
    Registration.find({
        event_id: req.params.event_id,
        user_id: req.params.user_id
    }, function (err, docs) {
        if (docs.length == 0) {
            res.json({
                registered: false
            })
        } else {
            res.json({
                registered: true
            })
        }
    })
});



module.exports = router;

//Modified by Narayanan SL on 11/12/19