const ChatRequestModal = ({ requests, onAccept, onDeny }) => {
  const validRequests = requests.filter(client => client); // Filter out null/empty values

  if (validRequests.length === 0) return null; // Don't render if no valid clients

  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center backdrop-blur-md">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-2">New Chat Requests</h2>
        {validRequests.map((client, index) => (
          <div key={index} className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Client {client} wants to chat</span>
            <div>
              <button
                className="bg-green-500 text-white px-3 py-1 rounded mr-2 ml-2"
                onClick={() => onAccept(client)}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => onDeny(client)}
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatRequestModal;
