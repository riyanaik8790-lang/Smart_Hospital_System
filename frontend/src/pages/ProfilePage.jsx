import React from "react";

function ProfilePage() {
  return (
    <div className="page-container">
      <h1>My Profile</h1>
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          marginTop: "20px",
        }}
      >
        <p><strong>Name:</strong> Admin User</p>
        <p><strong>Email:</strong> admin@hospital.com</p>
        <p><strong>Role:</strong> Hospital Administrator</p>
      </div>
    </div>
  );
}

export default ProfilePage;