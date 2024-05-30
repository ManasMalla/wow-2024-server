const express = require("express");

const router = express.Router();
module.exports = router;

const ShortlistedUserModel = require("../models/shortlisted-users");
const TeamModel = require("../models/team");
const AttendeeModel = require("../models/attendee");

// API for fetching shortlisted users

router.get("/get-shortlisted-users", async (req, res) => {
  try {
    const users = await ShortlistedUserModel.find();
    res.json({ status: true, data: Array.from(users) });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Unable to get data at the moment. Please try again. ${error.message}`,
    });
  }
});

// API for shortlisting users

router.post("/shortlist-user", async (req, res) => {
  try {
    const uid = req.body?.uid;
    const first_name = req.body?.first_name;
    const last_name = req.body?.last_name;
    const email = req.body?.email;

    if (!uid || !first_name || !last_name || !email) {
      console.log(req.body);
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }
    const shortlistedUser = new ShortlistedUserModel({
      uid,
      first_name,
      last_name,
      email,
    });
    const doesUserExist = await ShortlistedUserModel.findOne({ email: email });
    if (doesUserExist) {
      return res
        .status(400)
        .json({ status: false, message: "User is already shortlisted." });
    }
    const dataToSave = await shortlistedUser.save();
    //TODO: send email
    res
      .status(200)
      .json({ status: true, message: "Shortlisted. Sent the email :)" });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// API for creating a team

router.post("/create-team", async (req, res) => {
  try {
    const team_name = req.body?.team_name;
    const team_size = req.body?.team_size;
    const team_details = req.body?.team_details;
    const domain = req.body?.domain;

    if (!team_name || !team_size || !team_details || !domain) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    const doesTeamExist = await TeamModel.findOne({ team_name: team_name });
    if (doesTeamExist) {
      return res
        .status(400)
        .json({ status: false, message: "Team name is not unique" });
    }
    const teamMembersUniqueStatus = await Promise.all(
      team_details.map(
        async (member) =>
          (await TeamModel.findOne()
            .where("team_details.email")
            .in(member.email)) == null
      )
    );
    console.log(teamMembersUniqueStatus);
    const areTeamMembersUnique = teamMembersUniqueStatus.reduce((acc, curr) => {
      return acc && curr;
    });

    if (!areTeamMembersUnique) {
      const nonUniqueMember =
        team_details[teamMembersUniqueStatus.indexOf(false)];

      return res.status(400).json({
        status: false,
        message: `${nonUniqueMember.email} is already a part of another team`,
      });
    }

    const team = new TeamModel({
      team_name,
      team_size,
      team_details,
      domain,
    });

    const dataToSave = await team.save();
    res.status(200).json({ status: true, teamId: dataToSave._id });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// API for getting user details

router.get("/get-attendee-registration/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const isUserShortlisted = await ShortlistedUserModel.findOne({
      email: email,
    });
    if (!isUserShortlisted) {
      return res.status(404).json({
        status: false,
        message:
          "Oops You haven’t been shortlisted yet. If you feel there is a mistake, write to gdscwowvizag@gmail.com",
      });
    }
    const fetchUID = (await ShortlistedUserModel.findOne({ email: email })).uid;
    const isAttendeeRegistered = await AttendeeModel.findOne({
      uid: fetchUID,
    });
    const team_details = await TeamModel.findOne({
      "team_details.email": email,
    });
    if (isAttendeeRegistered) {
      const isTeamLead = team_details.team_details.filter(
        (e) => e.email === email
      )[0].team_lead;
      const dataToSave = await AttendeeModel.findOne({ uid: fetchUID });
      const result = isTeamLead
        ? {
            attendee_id: dataToSave._id,
            payment_utr: dataToSave.payment_utr,
            tshirt_size: dataToSave.tshirt_size,
            accommodation: dataToSave.accommodation,
            agenda_domain: dataToSave.agenda_domain,
            phone_number: dataToSave.phone_number,
            hackathon: {
              team_lead: team_details.team_lead,
              team_name: team_details.team_name,
              team_size: team_details.team_size,
              team_details: team_details.team_details,
              domain: team_details.domain,
            },
          }
        : {
            attendee_id: dataToSave._id,
            payment_utr: dataToSave.payment_utr,
            tshirt_size: dataToSave.tshirt_size,
            accommodation: dataToSave.accommodation,
            agenda_domain: dataToSave.agenda_domain,
            phone_number: dataToSave.phone_number,
            hackathon: {
              team_lead: team_details.team_lead,
              team_name: team_details.team_name,
              domain: team_details.domain,
            },
          };
      return res.status(200).json({
        status: true,
        data: result,
      });
    }

    if (team_details) {
      return res.status(200).json({
        status: true,
        data: {
          team_lead: team_details.team_details.filter(
            (e) => e.email === email
          )[0].team_lead,
          team_id: team_details._id,
          team_name: team_details.team_name,
          domain: team_details.domain,
        },
      });
    }

    return res.status(200).json({ status: true, data: "No team found" });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Unable to get data at the moment. Please try again. ${error.message}`,
    });
  }
});

// API for confirming attendee registration

router.post("/create-attendee-registration", async (req, res) => {
  try {
    const payment_utr = req.body?.payment_utr;
    const tshirt_size = req.body?.tshirt_size;
    const team_id = req.body?.team_id;
    const accommodation = req.body?.accommodation;
    const agenda_domain = req.body?.agenda_domain;
    const uid = req.body?.uid;
    const phone_number = req.body?.phone_number;
    if (
      !payment_utr ||
      !tshirt_size ||
      !team_id ||
      !(accommodation != null) ||
      !agenda_domain ||
      !uid ||
      !phone_number
    ) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    if (accommodation) {
      const checkIfAccommodationIsAvailable = await AttendeeModel.find({
        accommodation: true,
      }).countDocuments();
      if (checkIfAccommodationIsAvailable >= 100) {
        return res.status(400).json({
          status: false,
          message:
            "Accommodation is full. Oops! We’ve run out of accommodation. Kindly revert to gdscwowvizag@gmail.com if you really need accommodation. You can select ‘No’ and still attend the event.",
        });
      }
    }

    const isPaymentUtrUnique = await AttendeeModel.findOne({
      payment_utr: payment_utr,
    });
    if (isPaymentUtrUnique) {
      return res.status(400).json({
        status: false,
        message:
          "The payment UTR is not unique! Kindly recheck your UTR, if you haven’t paid, then please pay the amount and retry. If you still feel there is an issue, kindly write to gdscwowvizag@gmail.com",
      });
    }

    const team_details = await TeamModel.findOne({ _id: team_id });
    if (!team_details) {
      return res.status(400).json({
        status: false,
        message:
          "Team details not found. Please create a team before registering",
      });
    }

    const attendee = new AttendeeModel({
      payment_utr,
      tshirt_size,
      team_id,
      accommodation,
      agenda_domain,
      uid,
      phone_number,
    });
    const dataToSave = await attendee.save();
    const email = (await ShortlistedUserModel.findOne({ uid: uid })).email;
    const isTeamLead = team_details.team_details.filter(
      (e) => e.email === email
    )[0].team_lead;
    const result = isTeamLead
      ? {
          attendee_id: dataToSave._id,
          payment_utr: dataToSave.payment_utr,
          tshirt_size: dataToSave.tshirt_size,
          accommodation: dataToSave.accommodation,
          agenda_domain: dataToSave.agenda_domain,
          phone_number: dataToSave.phone_number,
          hackathon: {
            team_lead: team_details.team_lead,
            team_name: team_details.team_name,
            team_size: team_details.team_size,
            team_details: team_details.team_details,
            domain: team_details.domain,
          },
        }
      : {
          attendee_id: dataToSave._id,
          payment_utr: dataToSave.payment_utr,
          tshirt_size: dataToSave.tshirt_size,
          accommodation: dataToSave.accommodation,
          agenda_domain: dataToSave.agenda_domain,
          phone_number: dataToSave.phone_number,
          hackathon: {
            team_lead: team_details.team_lead,
            team_name: team_details.team_name,
            domain: team_details.domain,
          },
        };
    res.status(200).json({ status: true, data: result });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
});

// API for getting all attendees

router.get("/get-confirmed-attendees", async (req, res) => {
  try {
    const attendees = (await AttendeeModel.find()).map(async (attendee) => {
      return (await ShortlistedUserModel.findOne({ uid: attendee.uid })).email;
    });
    res.json({ status: true, data: Array.from(attendees) });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Unable to get data at the moment. Please try again. ${error.message}`,
    });
  }
});
