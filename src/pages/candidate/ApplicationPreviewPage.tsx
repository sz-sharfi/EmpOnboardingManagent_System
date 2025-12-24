import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, User } from 'lucide-react';

// Mock data for preview
const mockApplicationData = {
  postAppliedFor: 'Senior Software Engineer',
  name: 'John Doe',
  fatherOrHusbandName: 'Robert Doe',
  photo: null,
  permanentAddress: '123 Main Street, New York, NY 10001',
  communicationAddress: '456 Oak Avenue, New York, NY 10002',
  dateOfBirth: '1990-05-15',
  sex: 'Male',
  nationality: 'American',
  maritalStatus: 'Single',
  religion: 'Christian',
  mobileNo: '5551234567',
  email: 'john.doe@example.com',
  bankName: 'Chase Bank',
  accountNo: '1234567890',
  ifscCode: 'CHASUS33',
  branch: 'New York',
  panNo: 'ABCDE1234F',
  aadharNo: '123456789012',
  education: [
    { level: '10th Std', yearOfPassing: '2008', percentage: '82' },
    { level: '12th Std', yearOfPassing: '2010', percentage: '85' },
    { level: "Bachelor's Degree", yearOfPassing: '2014', percentage: '87' },
    { level: "Master's Degree", yearOfPassing: '2016', percentage: '89' },
  ],
};

interface PreviewField {
  label: string;
  value: string;
}

export default function ApplicationPreviewPage() {
  const navigate = useNavigate();
  const [data] = useState(mockApplicationData);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon');
  };

  const previewField = (label: string, value: string) => (
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-base text-gray-900 mt-0.5">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Application Preview</h1>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
            >
              <Printer size={20} />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
            >
              <Download size={20} />
              PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* PDF-Style Document */}
        <div className="bg-white shadow-lg rounded-lg p-8 md:p-12 border print:shadow-none print:rounded-none">
          {/* Document Header */}
          <div className="border-b-2 border-gray-300 pb-8 mb-8 relative">
            {/* Company Name */}
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
              JRM INFOSYSTEMS PRIVATE LIMITED
            </h2>

            {/* Form Title */}
            <h3 className="text-center text-xl font-semibold text-gray-800 mb-8">APPLICATION FORM</h3>

            {/* Photo (if available) */}
            {data.photo && (
              <div className="absolute top-8 right-8 print:right-12 print:top-12">
                <img src={data.photo} alt="Candidate" className="w-32 h-32 rounded border-2 border-gray-300 object-cover" />
              </div>
            )}
          </div>

          {/* Section 1: Basic Information */}
          <section className="mb-8 pb-6 border-b border-gray-300">
            <h4 className="text-lg font-bold text-gray-800 mb-4">BASIC INFORMATION</h4>
            <div className="grid grid-cols-2 gap-6">
              {previewField('Post Applied For', data.postAppliedFor)}
              {previewField('Full Name', data.name)}
              {previewField('Father\'s / Husband\'s Name', data.fatherOrHusbandName)}
            </div>
          </section>

          {/* Section 2: Address Details */}
          <section className="mb-8 pb-6 border-b border-gray-300">
            <h4 className="text-lg font-bold text-gray-800 mb-4">ADDRESS DETAILS</h4>
            <div className="space-y-4">
              {previewField('Permanent Address', data.permanentAddress)}
              {previewField('Address for Communication', data.communicationAddress)}
            </div>
          </section>

          {/* Section 3: Personal Details */}
          <section className="mb-8 pb-6 border-b border-gray-300">
            <h4 className="text-lg font-bold text-gray-800 mb-4">PERSONAL DETAILS</h4>
            <div className="grid grid-cols-2 gap-6">
              {previewField('Date of Birth', data.dateOfBirth)}
              {previewField('Sex', data.sex)}
              {previewField('Nationality', data.nationality)}
              {previewField('Marital Status', data.maritalStatus)}
              {previewField('Religion', data.religion)}
              {previewField('Mobile No.', data.mobileNo)}
              {previewField('Email ID', data.email)}
            </div>
          </section>

          {/* Section 4: Banking Information */}
          <section className="mb-8 pb-6 border-b border-gray-300">
            <h4 className="text-lg font-bold text-gray-800 mb-4">BANKING INFORMATION</h4>
            <div className="grid grid-cols-2 gap-6">
              {previewField('Bank Name', data.bankName)}
              {previewField('SB A/C No.', data.accountNo)}
              {previewField('IFSC Code', data.ifscCode)}
              {previewField('Branch', data.branch)}
            </div>
          </section>

          {/* Section 5: Identity Documents */}
          <section className="mb-8 pb-6 border-b border-gray-300">
            <h4 className="text-lg font-bold text-gray-800 mb-4">IDENTITY DOCUMENTS</h4>
            <div className="grid grid-cols-2 gap-6">
              {previewField('PAN No.', data.panNo)}
              {previewField('Aadhar No.', data.aadharNo)}
            </div>
          </section>

          {/* Section 6: Educational Qualifications */}
          <section className="mb-8 pb-6 border-b border-gray-300">
            <h4 className="text-lg font-bold text-gray-800 mb-4">EDUCATIONAL QUALIFICATIONS</h4>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Qualification Level
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Year of Passing
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    % of Marks
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.education.map((edu, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{edu.level}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{edu.yearOfPassing}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{edu.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Section 7: Declaration */}
          <section>
            <h4 className="text-lg font-bold text-gray-800 mb-4">DECLARATION</h4>

            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              I hereby declare that all statements made in the application are true, complete and correct to the best of my knowledge and belief. I understand that in the event of any information being found untrue/false/incorrect or I do not satisfy the eligibility criteria, my candidature/appointment will be cancelled/terminated, without assigning any reasons thereof.
            </p>

            <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-400">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-4">Place</p>
                <p className="text-base text-gray-900">New York</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 mb-4">Date</p>
                <p className="text-base text-gray-900">{new Date().toISOString().split('T')[0]}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          header {
            display: none;
          }
          main {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
