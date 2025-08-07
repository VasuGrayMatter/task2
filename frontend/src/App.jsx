import { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Dynamic base URL for different environments
const baseUrl = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production (same domain)
  : "http://localhost:3000"; // Use localhost in development

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", department: "" });
  const [editId, setEditId] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/api/employees`);
      setEmployees(res.data);
    } catch (error) {
      console.error("Fetch employees error:", error);
      toast.error("❌ Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.department) {
      return toast.warning("⚠️ Please fill all fields");
    }

    setLoading(true);
    try {
      if (editId) {
        await axios.put(`${baseUrl}/api/employees/${editId}`, form);
        toast.success("✅ Employee updated");
      } else {
        await axios.post(`${baseUrl}/api/employees`, form);
        toast.success("✅ Employee added");
      }
      setForm({ name: "", email: "", department: "" });
      setEditId(null);
      fetchEmployees();
    } catch (err) {
      console.error("Submit error:", err);
      const msg = err.response?.data?.error || "❌ Submission failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setForm({ name: emp.name, email: emp.email, department: emp.department });
    setEditId(emp._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${baseUrl}/api/employees/${id}`);
      toast.info("🗑️ Employee deleted");
      fetchEmployees();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("❌ Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchById = async () => {
    if (!searchId.trim()) {
      toast.warning("⚠️ Please enter an ID to search");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/api/employees/${searchId}`);
      setEmployees([res.data]);
      toast.success("🔍 Employee found");
    } catch (error) {
      console.error("Search error:", error);
      toast.warning("⚠️ Employee not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <ToastContainer position="top-right" autoClose={3000} />

      <h2 className="text-center mb-4 text-primary fw-bold">
        📋 MongoDB Employee Directory
      </h2>

      {/* Connection Status */}
      <div className="alert alert-info text-center mb-4">
        <strong>API Base URL:</strong> {baseUrl || 'Same Domain'}/api
      </div>

      {/* Form */}
      <div className="card shadow-lg p-4 mb-5 border-0 rounded-4">
        <h5 className="mb-3">{editId ? "✏️ Update Employee" : "➕ Add New Employee"}</h5>
        <form onSubmit={handleSubmit} className="row g-3">
          <div className="col-md-4">
            <input
              name="name"
              className="form-control"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="col-md-4">
            <input
              name="email"
              className="form-control"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="col-md-4">
            <input
              name="department"
              className="form-control"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="col-12 text-end">
            <button
              type="submit"
              className={`btn ${editId ? "btn-warning" : "btn-success"} me-2 px-4`}
              disabled={loading}
            >
              {loading ? "Processing..." : (editId ? "Update" : "Add")}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              disabled={loading}
              onClick={() => {
                setForm({ name: "", email: "", department: "" });
                setEditId(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="input-group mb-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by MongoDB ID"
          className="form-control"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          disabled={loading}
        />
        <button 
          className="btn btn-primary" 
          onClick={handleSearchById}
          disabled={loading || !searchId.trim()}
        >
          🔍 Search
        </button>
        <button 
          className="btn btn-dark" 
          onClick={fetchEmployees}
          disabled={loading}
        >
          🔄 Show All
        </button>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-striped table-bordered align-middle shadow-sm">
          <thead className="table-dark text-center">
            <tr>
              <th>ID</th>
              <th>👤 Name</th>
              <th>📧 Email</th>
              <th>🏢 Department</th>
              <th>⚙️ Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div>Loading employees...</div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id}>
                  <td className="text-break" style={{fontSize: '0.8rem', maxWidth: '150px'}}>
                    {emp._id}
                  </td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(emp)}
                      disabled={loading}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(emp._id)}
                      disabled={loading}
                    >
                      ❌ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;