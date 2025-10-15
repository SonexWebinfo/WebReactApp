import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { Modal, Button } from "react-bootstrap";
import { toast } from 'react-toastify';
import Select from "react-select";

const Spinner = ({ message = "Loading..." }) => (
  <div className="d-flex justify-content-center align-items-center p-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">{message}</span>
    </div>
  </div>
);

export const JobTable = () => {
  const [jobWorkData, setJobWorkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingJobWorkId, setEditingJobWorkId] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [jobTypeOptions, setJobTypeOptions] = useState([]);
  const [filteredCityOptions, setFilteredCityOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobWorkForm, setJobWorkForm] = useState({
    job_work_name: "",
    job_work_phone: "",
    job_work_email: "",
    job_work_address: "",
    job_work_state: "",
    job_work_city: "",
    job_work_pincode: "",
    job_work_type: "",
  });
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Centralized error handling
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);
    toast.error(error.response?.data?.message || defaultMessage);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobWorkData(),
        fetchStateOptions(),
        fetchCityOptions(),
        fetchJobWorkTypeOptions(),
      ]);
    } catch (error) {
      handleApiError(error, "Failed to load initial data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStateOptions = async () => {
    try {
      const response = await api.get("/api/get-states");
      if (response.data && Array.isArray(response.data)) {
        setStateOptions(
          response.data.map((state) => ({
            value: state.id,
            label: state.name,
          }))
        );
      } else {
        throw new Error("Failed to load states.");
      }
    } catch (error) {
      handleApiError(error, "Failed to load states.");
    }
  };

  const fetchCityOptions = async () => {
    try {
      const response = await api.get("/api/get-cities");
      if (response.data && Array.isArray(response.data)) {
        setCityOptions(
          response.data.map((city) => ({
            value: city.id,
            label: city.name,
            stateId: city.state_id,
          }))
        );
      } else {
        throw new Error("Failed to load cities.");
      }
    } catch (error) {
      handleApiError(error, "Failed to load cities.");
    }
  };

  const fetchJobWorkTypeOptions = async () => {
    try {
      const response = await api.get("/api/fetch-job-work-type");
      if (response.data && Array.isArray(response.data)) {
        setJobTypeOptions(
          response.data.map((jobType) => ({
            value: jobType.id,
            label: jobType.job_work_type,
          }))
        );
      } else {
        throw new Error("Failed to load job work types.");
      }
    } catch (error) {
      handleApiError(error, "Failed to load job work types.");
    }
  };

  const fetchJobWorkData = useCallback(
    async (page = 1, search = "", perPageCount = perPage) => {
      setPageLoading(true);
      try {
        const response = await api.get("/api/fetch-jobwork-table-data", {
          params: {
            page,
            search: search,
            per_page: perPageCount,
            status: statusFilter === "all" ? undefined : statusFilter,
          },
        });

        if (!response.data) {
          throw new Error("No data received from API.");
        }

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setJobWorkData(data);

        setPagination({
          currentPage: response.data.pagination?.current_page || 1,
          lastPage: response.data.pagination?.last_page || 1,
          total: response.data.pagination?.total || 0,
          from: response.data.pagination?.from || 0,
          to: response.data.pagination?.to || 0,
        });
      } catch (error) {
        handleApiError(error, "Failed to fetch job work data.");
        setJobWorkData([]);
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    },
    [perPage, statusFilter]
  );

  const handleStateChange = (selectedOption) => {
    const stateId = selectedOption?.value || "";
    setJobWorkForm((prev) => ({
      ...prev,
      job_work_state: stateId,
      job_work_city: "",
    }));
    setFilteredCityOptions(
      cityOptions.filter((city) => city.stateId === stateId)
    );
  };

  const handleJobTypeChange = (selectedOption) => {
    setJobWorkForm((prev) => ({
      ...prev,
      job_work_type: selectedOption?.value || "",
    }));
  };

  const handleCityChange = (selectedOption) => {
    setJobWorkForm((prev) => ({
      ...prev,
      job_work_city: selectedOption?.value || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobWorkForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filteredData = useMemo(() => {
    return jobWorkData.filter((job) => {
      if (statusFilter === "active") return job.status === 0;
      if (statusFilter === "inactive") return job.status === 1;
      return true;
    });
  }, [jobWorkData, statusFilter]);

  const handlePageChange = (page) => {
    if (
      page > 0 &&
      page <= pagination.lastPage &&
      page !== pagination.currentPage
    ) {
      fetchJobWorkData(page, searchText);
    }
  };

  const validateForm = () => {
    const {
      job_work_name,
      job_work_phone,
      job_work_email,
      job_work_state,
      job_work_city,
      job_work_type,
      job_work_pincode,
    } = jobWorkForm;

    if (
      !job_work_name ||
      !job_work_phone ||
      !job_work_email ||
      !job_work_state ||
      !job_work_city ||
      !job_work_type ||
      !job_work_pincode
    ) {
      toast.warning("Please fill in all required fields.");
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(job_work_phone)) {
      toast.warning("Please enter a valid 10-digit phone number.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(job_work_email)) {
      toast.warning("Please enter a valid email address.");
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(job_work_pincode)) {
      toast.warning("Please enter a valid 6-digit pincode.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const url = editingJobWorkId
        ? `/api/update-jobwork-data/${editingJobWorkId}`
        : "/api/store-jobwork-data";

      await api.post(url, jobWorkForm);
      toast.success(
        `Job Work ${editingJobWorkId ? "updated" : "added"} successfully!`
      );
      fetchJobWorkData(pagination.currentPage);
      setShowModal(false);
      resetForm();
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        handleApiError(error, "This Job Work name already exists.");
      } else if (status === 422) {
        handleApiError(error, "Please fix the validation errors.");
      } else {
        handleApiError(error, "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const editJobWork = async (jobId) => {
    try {
      const response = await api.get(`/api/get-jobwork-data/${jobId}`);
      if (response.data?.data) {
        const stateId = response.data.data.state_id || 0;
        setFilteredCityOptions(
          cityOptions.filter((city) => city.stateId === stateId)
        );
        setJobWorkForm({
          job_work_name: response.data.data.job_work_name || "",
          job_work_phone: response.data.data.job_work_phone || "",
          job_work_email: response.data.data.job_work_email || "",
          job_work_address: response.data.data.job_work_address || "",
          job_work_state: stateId,
          job_work_city: response.data.data.city_id || 0,
          job_work_pincode: response.data.data.job_work_pincode || "",
          job_work_type: response.data.data.job_work_type_id || "",
        });
        setEditingJobWorkId(jobId);
        setShowModal(true);
      } else {
        toast.error("Job Work data not found.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching Job Work data.");
    }
  };

  const deleteJobWork = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job work?"))
      return;

    setDeletingId(jobId);
    try {
      await api.delete(`/api/delete-jobwork/${jobId}`);
      toast.success("Job Work deleted successfully!");
      fetchJobWorkData(pagination.currentPage);
    } catch (error) {
      handleApiError(error, "Failed to delete Job Work.");
    } finally {
      setDeletingId(null);
    }
  };

  const debouncedFetchJobWorkData = useMemo(
    () =>
      debounce((page, search, perPageCount) => {
        fetchJobWorkData(page, search, perPageCount);
      }, 500),
    [fetchJobWorkData, perPage, statusFilter]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchText(value);
    debouncedFetchJobWorkData(1, value, perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearSearch = () => {
    setSearchText("");
    fetchJobWorkData(1, "", perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const resetForm = () => {
    setJobWorkForm({
      job_work_name: "",
      job_work_phone: "",
      job_work_email: "",
      job_work_address: "",
      job_work_state: "",
      job_work_city: "",
      job_work_pincode: "",
      job_work_type: "",
    });
    setEditingJobWorkId(null);
  };

  const startIndex = (pagination.currentPage - 1) * perPage;

  return (
    <>
      <Helmet>
        <title>ERP | Job Work</title>
      </Helmet>
      <div className="card">
        <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
          <span>Basic Info Job Work Details</span>
          <div className="btn-group mt-2 mt-md-0">
            <button
              aria-label="Click me"
              type="button"
              className="btn btn-primary btn-sm dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-user"></i> Manage Job Work
            </button>
            <ul className="dropdown-menu">
              <li>
                <a
                  aria-label="dropdown action link"
                  className="dropdown-item"
                  href="#"
                  onClick={handleShow}
                >
                  <i className="bx bxs-skirt"></i> Add Job Work
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  aria-label="dropdown action link"
                  className="dropdown-item"
                  href="#"
                >
                  <i className="bx bx-cloud-upload"></i> Import
                </a>
              </li>
              <li>
                <a
                  aria-label="dropdown action link"
                  className="dropdown-item"
                  href="#"
                >
                  <i className="bx bx-cloud-download"></i> Export
                </a>
              </li>
            </ul>
          </div>
        </h5>
        <hr className="mt-0 mb-0 shadow-sm" />
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="perPageSelect" className="mb-0 fw-semibold">
              Show
            </label>
            <select
              id="perPageSelect"
              className="form-select form-select-sm fw-bold"
              style={{ width: "80px" }}
              value={perPage}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setPerPage(value);
                fetchJobWorkData(1, searchText, value);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
            {/* <label htmlFor="statusFilterSelect" className="mb-0 fw-semibold">
              Status
            </label>
            <select
              id="statusFilterSelect"
              className="form-select form-select-sm fw-bold"
              style={{ width: "120px" }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchJobWorkData(1, searchText, perPage);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select> */}
          </div>
          <div
            className="d-flex align-items-center gap-2"
            style={{ maxWidth: "200px", width: "100%" }}
          >
            <input
              type="text"
              className="form-control form-control-sm fw-semibold"
              placeholder="Search Job Work Name"
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Search Job Work Name"
            />
            {searchText && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={clearSearch}
                aria-label="Clear Search"
              >
                <i className="bx bx-x"></i>
              </button>
            )}
          </div>
        </div>
        <div className="table-responsive text-nowrap fs-6">
          {loading ? (
            <Spinner message="Loading..." />
          ) : filteredData.length > 0 ? (
            <>
              <table className="table table-hover text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">Sr.</th>
                    <th>Job Work Name</th>
                    <th>Phone No</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Job Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="table-border-bottom-0">
                  {pageLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center p-5">
                        <Spinner message="Loading..." />
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((job, index) => (
                      <tr key={job?.job_id || index}>
                        <td className="text-center">
                          {startIndex + index + 1}
                        </td>
                        <td>{job?.job_work_name || "N/A"}</td>
                        <td>{job?.job_work_phone || "N/A"}</td>
                        <td>{job?.job_work_email || "N/A"}</td>
                        <td>{job?.city_name || "N/A"}</td>
                        <td>{job?.job_work_type || "N/A"}</td>
                        <td>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm dropdown-toggle hide-arrow"
                              data-bs-toggle="dropdown"
                              aria-label="Action Menu"
                            >
                              <i className="bx bx-down-arrow-circle"></i>
                            </button>
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => editJobWork(job.job_id)}
                                aria-label="Edit Job Work"
                              >
                                <i className="bx bx-edit-alt me-1"></i> Edit
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => deleteJobWork(job.job_id)}
                                disabled={deletingId === job.job_id}
                                aria-label="Delete Job Work"
                              >
                                <i className="bx bx-trash me-1"></i> Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <hr className="mt-0 mb-0 shadow-sm" />
              {pagination.total > 0 && (
                <div className="d-flex justify-content-end align-items-center gap-2 mb-3 pt-3 me-2">
                  <span className="fw-semibold">
                    {pagination.from} - {pagination.to} of {pagination.total}
                  </span>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={pagination.currentPage === 1}
                      aria-label="Previous Page"
                    >
                      <i className="bx bx-chevron-left" />
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={pagination.currentPage === pagination.lastPage}
                      aria-label="Next Page"
                    >
                      <i className="bx bx-chevron-right" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-5">No records found</div>
          )}
        </div>
      </div>

      <Modal
        show={showModal}
        onHide={handleClose}
        aria-labelledby="jobWorkModalTitle"
      >
        <Modal.Header closeButton>
          <Modal.Title id="jobWorkModalTitle">
            {editingJobWorkId ? "Edit Job Work" : "Create Job Work"}
          </Modal.Title>
        </Modal.Header>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Body>
          <div className="row g-2" disabled={isSubmitting}>
            <div className="col-md-12 mb-1">
              <label className="form-label">Name</label>
              <div className="input-group">
                <input
                  type="text"
                  name="job_work_name"
                  value={jobWorkForm.job_work_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Name"
                  required
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-user"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">Phone No</label>
              <div className="input-group">
                <input
                  type="text"
                  name="job_work_phone"
                  value={jobWorkForm.job_work_phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Phone No"
                  required
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-phone"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">Email</label>
              <div className="input-group">
                <input
                  type="email"
                  name="job_work_email"
                  value={jobWorkForm.job_work_email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Email Address"
                  required
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-envelope"></i>
                </span>
              </div>
            </div>
            <div className="col-md-12 mb-1">
              <label className="form-label">Address</label>
              <textarea
                name="job_work_address"
                value={jobWorkForm.job_work_address}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Address"
                rows="2"
                required
              ></textarea>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">State</label>
              <Select
                options={stateOptions}
                name="job_work_state"
                value={stateOptions.find(
                  (option) => option.value === jobWorkForm.job_work_state
                )}
                onChange={handleStateChange}
                placeholder="Select State"
                isClearable
              />
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">City</label>
              <Select
                options={filteredCityOptions}
                name="job_work_city"
                isDisabled={!jobWorkForm.job_work_state}
                value={filteredCityOptions.find(
                  (option) => option.value === jobWorkForm.job_work_city
                )}
                onChange={handleCityChange}
                placeholder="Select City"
                isClearable
              />
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">Pincode</label>
              <div className="input-group">
                <input
                  type="text"
                  name="job_work_pincode"
                  value={jobWorkForm.job_work_pincode}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Pincode"
                  maxLength="6"
                  required
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-map-pin"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">Job Work Type</label>
              <Select
                options={jobTypeOptions}
                name="job_work_type"
                value={jobTypeOptions.find(
                  (option) => option.value === jobWorkForm.job_work_type
                )}
                onChange={handleJobTypeChange}
                placeholder="Select Job Work Type"
                isClearable
              />
            </div>
          </div>
        </Modal.Body>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={handleClose}>
            <i className="bx bx-window-close"></i> Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-label={editingJobWorkId ? "Update Job" : "Save Job"}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>
                Please wait...
              </>
            ) : (
              <>
                <i className="bx bx-book-add"></i>{" "}
                {editingJobWorkId ? "Update Job" : "Save Job"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default JobTable;
