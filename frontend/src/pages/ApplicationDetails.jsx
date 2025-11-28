// src/pages/ApplicationDetails.jsx
import React from "react";
import { useParams } from "react-router-dom";

function ApplicationDetails() {
  const { id } = useParams();

  // Temporary mock data — replace with real API later
  const application = {
    applicationId: "A001",
    studentName: "Lee Wen Xuan",
    studentId: "22115737",
    intake: "202301",
    programme: "BSc (Hons) in Computer Science",
    previousInstitution: "Sunway College",
    qualification: "Diploma in IT",
    subjectRequested: "Programming Principles",
    type: "Credit Exemption",
    dateSubmitted: "12 Nov 2025",
  };

  return (
    <div className="w-full px-8 py-6">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-[#3A3A3A] mb-6">
        Application Details
      </h1>

      {/* Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">

        {/* Application Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-12">

          <div>
            <p className="text-sm text-gray-500">Application ID</p>
            <p className="text-base font-medium">{application.applicationId}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Student Name</p>
            <p className="text-base font-medium">{application.studentName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Student ID</p>
            <p className="text-base font-medium">{application.studentId}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Intake</p>
            <p className="text-base font-medium">{application.intake}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Qualification</p>
            <p className="text-base font-medium">{application.qualification}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Programme</p>
            <p className="text-base font-medium">{application.programme}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Previous Institution</p>
            <p className="text-base font-medium">{application.previousInstitution}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Requested Subject</p>
            <p className="text-base font-medium">{application.subjectRequested}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Application Type</p>
            <p className="text-base font-medium">{application.type}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Date Submitted</p>
            <p className="text-base font-medium">{application.dateSubmitted}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ApplicationDetails;
