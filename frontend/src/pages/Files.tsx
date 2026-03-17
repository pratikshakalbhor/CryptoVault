interface FilesProps {
  onNavigate: (page: string) => void;
}

export default function Files({ onNavigate }: FilesProps) {
  const files = [
    { name: 'Legal_Contract_v2.pdf', date: '2024-03-10', status: 'Sealed', hash: '0x7f2...a1b' },
    { name: 'Research_Data_Final.csv', date: '2024-03-08', status: 'Sealed', hash: '0x3e1...c9d' },
    { name: 'Quarterly_Report.docx', date: '2024-03-05', status: 'Sealed', hash: '0x9a4...e5f' },
  ];

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h2>My Sealed Files</h2>
          <button className="btn-secondary" onClick={() => onNavigate('upload')}>Seal New File</button>
        </div>

        <div className="table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Sealed Date</th>
                <th>Status</th>
                <th>Proof Hash</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, i) => (
                <tr key={i}>
                  <td className="file-name">{file.name}</td>
                  <td>{file.date}</td>
                  <td><span className="badge success">{file.status}</span></td>
                  <td className="hash-cell">{file.hash}</td>
                  <td>
                    <button className="btn-icon">👁</button>
                    <button className="btn-icon">↓</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
