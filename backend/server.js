const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const validator = require("validator");
const dotenv=require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    
    if (mongoose.connections[0].readyState) {
      return;
    }
    await mongoose.connect("mongodb+srv://vasusinghal:6hgc5Gc3kkAASbHn@cluster0.qspppxl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("✅ Connected to MongoDB");
    
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

// Schema + Model
const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: [validator.isEmail, "Invalid email format"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
    },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

// Routes

// GET all employees
app.get("/api/employees", async (req, res) => {
  try {
    await connectDB();
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// GET one employee
app.get("/api/employees/:id", async (req, res) => {
  try {
    await connectDB();
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(400).json({ error: "Invalid employee ID" });
  }
});

// POST new employee
app.post("/api/employees", async (req, res) => {
  try {
    await connectDB();
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error("Error creating employee:", error);
    if (error.code === 11000) {
      res.status(400).json({ error: "Email already exists" });
    } else if (error.name === "ValidationError") {
      res.status(400).json({ 
        error: Object.values(error.errors).map(e => e.message).join(", ") 
      });
    } else {
      res.status(500).json({ error: "Failed to create employee" });
    }
  }
});

// PUT update employee
app.put("/api/employees/:id", async (req, res) => {
  try {
    await connectDB();
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    if (error.name === "ValidationError") {
      res.status(400).json({ 
        error: Object.values(error.errors).map(e => e.message).join(", ") 
      });
    } else {
      res.status(400).json({ error: "Invalid update or ID" });
    }
  }
});

// DELETE employee
app.delete("/api/employees/:id", async (req, res) => {
  try {
    await connectDB();
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(deletedEmployee);
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(400).json({ error: "Invalid employee ID" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;