// Function to convert data to CSV format
const convertToCSV = (data) => {
  const bookings = data.bookings.map(booking => ({
    id: booking.id,
    userName: booking.userName,
    environmentName: booking.environmentName,
    startDate: new Date(booking.startDate).toLocaleDateString(),
    endDate: new Date(booking.endDate).toLocaleDateString(),
    purpose: booking.purpose,
    status: booking.status
  }));

  // Create CSV headers
  const headers = Object.keys(bookings[0]).join(',');
  
  // Create CSV rows
  const rows = bookings.map(booking => 
    Object.values(booking).map(value => `"${value}"`).join(',')
  );

  return [headers, ...rows].join('\n');
};

// Function to download CSV file
export const exportToExcel = (data, fileName = 'export') => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Function to format data for export
export const prepareDataForExport = (bookings, environments, users) => {
  return {
    bookings: bookings.map(booking => ({
      ...booking,
      userName: users.find(u => u.id === booking.userId)?.name || 'Unknown User',
      environmentName: environments.find(e => e.id === booking.environmentId)?.name || 'Unknown Environment'
    }))
  };
}; 