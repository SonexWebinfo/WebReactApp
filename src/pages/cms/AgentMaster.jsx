import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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

export const AgentTable = () => {
  const [agentData, setAgentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filteredCityOptions, setFilteredCityOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentForm, setAgentForm] = useState({
    agent_name: "",
    agent_phone: "",
    agent_email: "",
    agent_address: "",
    agent_state: "",
    agent_city: "",
    agent_pincode: "",
    agent_commission: "",
  });
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFetch = useRef(true);

  // Centralized error handling
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);
    toast.error(error.response?.data?.message || defaultMessage);
  };

  useEffect(() => {
    if (initialFetch.current) {
      initialFetch.current = false;
      fetchInitialData();
    }
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAgentData(),
        fetchStateOptions(),
        fetchCityOptions(),
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
      //console.log("State Options Response:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setStateOptions(
          response.data.map((state) => ({
            value: state.id,
            label: state.name,
          }))
        );
      } else {
        toast.error("Failed to load states.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching states.");
    }
  };

  const fetchCityOptions = async () => {
    try {
      const response = await api.get("/api/get-cities");
      //console.log("City Options Response:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setCityOptions(
          response.data.map((city) => ({
            value: city.id,
            label: city.name,
            stateId: city.state_id,
          }))
        );
      } else {
        toast.error("Failed to load cities.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching cities.");
    }
  };

  const fetchAgentData = useCallback(
    async (page = 1, search = "", perPageCount = perPage) => {
      setPageLoading(true);
      try {
        const response = await api.get("/api/fetch-agent-table-data", {
          params: {
            page,
            search: search,
            per_page: perPageCount,
            status: statusFilter === "all" ? undefined : statusFilter,
          },
        });

        console.log("Agent Data Response:", response.data);

        if (!response.data) {
          throw new Error("No data received from API.");
        }

        // Adjust based on actual API response structure
        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setAgentData(data);
        setPagination({
          currentPage: response.data.pagination?.current_page || 1,
          lastPage: response.data.pagination?.last_page || 1,
          total: response.data.pagination?.total || data.length || 0,
          from: response.data.pagination?.from || 1,
          to: response.data.pagination?.to || data.length || 0,
        });
      } catch (error) {
        handleApiError(error, "Failed to fetch agent data.");
        setAgentData([]);
      } finally {
        setPageLoading(false);
      }
    },
    [perPage, statusFilter]
  );

  const handleStateChange = (selectedOption) => {
    const stateId = selectedOption?.value || "";
    setAgentForm((prev) => ({
      ...prev,
      agent_state: stateId,
      agent_city: "",
    }));
    setFilteredCityOptions(
      cityOptions.filter((city) => city.stateId === stateId)
    );
  };

  const handleCityChange = (selectedOption) => {
    setAgentForm((prev) => ({
      ...prev,
      agent_city: selectedOption?.value || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAgentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePageChange = (page) => {
    if (
      page > 0 &&
      page <= pagination.lastPage &&
      page !== pagination.currentPage
    ) {
      fetchAgentData(page, searchText);
    }
  };

  const validateForm = () => {
    const {
      agent_name,
      agent_phone,
      agent_email,
      agent_state,
      agent_city,
      agent_commission,
    } = agentForm;

    if (
      !agent_name ||
      !agent_phone ||
      !agent_email ||
      !agent_state ||
      !agent_city ||
      !agent_commission
    ) {
      toast.warning("Please fill in all required fields.");
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(agent_phone)) {
      toast.warning("Please enter a valid 10-digit phone number.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(agent_email)) {
      toast.warning("Please enter a valid email address.");
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (
      agentForm.agent_pincode &&
      !pincodeRegex.test(agentForm.agent_pincode)
    ) {
      toast.warning("Please enter a valid 6-digit pincode.");
      return false;
    }

    const commission = parseFloat(agent_commission);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast.warning("Please enter a valid commission percentage (0-100).");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingAgentId
        ? `/api/update-agent-data/${editingAgentId}`
        : "/api/store-agent-data";

      await api.post(url, agentForm);
      toast.success(
        `Agent ${editingAgentId ? "updated" : "added"} successfully!`
      );
      fetchAgentData(pagination.currentPage);
      setShowModal(false);
      resetForm();
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        handleApiError(error, "This agent name already exists.");
      } else if (status === 422) {
        handleApiError(error, "Please fix the validation errors.");
      } else {
        handleApiError(error, "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const editAgent = async (agentId) => {
    try {
      const response = await api.get(`/api/get-agent-data/${agentId}`);
      console.log("Edit Agent Response:", response.data);
      if (response.data?.data) {
        const stateId = response.data.data.state_id || "";
        setFilteredCityOptions(
          cityOptions.filter((city) => city.stateId === stateId)
        );
        setAgentForm({
          agent_name: response.data.data.agent_name || "",
          agent_phone: response.data.data.agent_phone || "",
          agent_email: response.data.data.agent_email || "",
          agent_address: response.data.data.agent_address || "",
          agent_state: stateId,
          agent_city: response.data.data.city_id || "",
          agent_pincode: response.data.data.agent_pincode || "",
          agent_commission: response.data.data.agent_commission || "",
        });
        setEditingAgentId(agentId);
        setShowModal(true);
      } else {
        toast.error("Agent data not found.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching agent data.");
    }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this Agent?")) return;

    try {
      const response = await api.delete(`/api/delete-agent/${agentId}`);
      console.log("Delete Agent Response:", response.data);
      if (response.status === 200) {
        toast.success("Agent deleted successfully!");
        setAgentData((prevData) =>
          prevData.filter((agent) => agent.agent_id !== agentId)
        );
        fetchAgentData(pagination.currentPage);
      } else {
        toast.error("Failed to delete agent.");
      }
    } catch (error) {
      handleApiError(error, "Something went wrong!");
    }
  };

  const debouncedFetchAgentData = useMemo(
    () =>
      debounce((page, search, perPageCount) => {
        fetchAgentData(page, search, perPageCount);
      }, 500),
    [fetchAgentData]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchText(value);
    debouncedFetchAgentData(1, value, perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearSearch = () => {
    setSearchText("");
    fetchAgentData(1, "", perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const filteredData = useMemo(() => {
    return agentData.filter((agent) => {
      if (statusFilter === "active")
        return agent.status === 0 || agent.status === "active";
      if (statusFilter === "inactive")
        return agent.status === 1 || agent.status === "inactive";
      return true;
    });
  }, [agentData, statusFilter]);

  const resetForm = () => {
    setAgentForm({
      agent_name: "",
      agent_phone: "",
      agent_email: "",
      agent_address: "",
      agent_state: "",
      agent_city: "",
      agent_pincode: "",
      agent_commission: "",
    });
    setEditingAgentId(null);
    setFilteredCityOptions([]);
  };

  const startIndex = (pagination.currentPage - 1) * perPage;

  return (
    <>
      <Helmet>
        <title>ERP | Agent Master</title>
      </Helmet>
      <div className="card">
        <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
          <span>Basic Info Agent Details</span>
          <div className="btn-group mt-2 mt-md-0">
            <button
              aria-label="Click me"
              type="button"
              className="btn btn-primary btn-sm dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-user"></i> Manage Agent
            </button>
            <ul className="dropdown-menu">
              <li>
                <a
                  aria-label="dropdown action link"
                  className="dropdown-item"
                  href="#"
                  onClick={handleShow}
                >
                  <i className="bx bx-user"></i> Add Agent
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
                fetchAgentData(1, searchText, value);
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
                fetchAgentData(1, searchText, perPage);
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
              placeholder="Search Agent Name"
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Search Agent Name"
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
                    <th>Agent Name</th>
                    <th>Phone No</th>
                    <th>Email</th>
                    <th>City</th>
                    <th className="text-center">Commission (%)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center p-5">
                        <Spinner message="Loading..." />
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((agent, index) => (
                      <tr key={agent?.agent_id || index}>
                        <td className="text-center">
                          {startIndex + index + 1}
                        </td>
                        <td>{agent?.agent_name || "N/A"}</td>
                        <td>{agent?.agent_phone || "N/A"}</td>
                        <td>{agent?.agent_email || "N/A"}</td>
                        <td>{agent?.city_name || "N/A"}</td>
                        <td className="text-center">
                          {agent?.agent_commission || "0"}
                        </td>
                        <td>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              data-bs-toggle="dropdown"
                            >
                              <i className="bx bx-down-arrow-circle"></i>
                            </button>
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item me-2"
                                onClick={() => editAgent(agent.agent_id)}
                              >
                                <i className="bx bx-edit"></i> Edit
                              </button>
                              <button
                                className="dropdown-item me-2"
                                onClick={() => deleteAgent(agent.agent_id)}
                              >
                                <i className="bx bx-trash"></i> Delete
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
                <div className="d-flex justify-content-end align-items-center gap-2 mb-1 pt-3 me-2">
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
        aria-labelledby="agentModalTitle"
      >
        <Modal.Header closeButton>
          <Modal.Title id="agentModalTitle">
            {editingAgentId ? "Edit Agent" : "Create Agent"}
          </Modal.Title>
        </Modal.Header>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Body>
          <div className="row g-1">
            <div className="col-md-12 mb-1">
              <label className="form-label">Agent Name</label>
              <div className="input-group">
                <input
                  type="text"
                  name="agent_name"
                  value={agentForm.agent_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Agent Name"
                  required
                  disabled={isSubmitting}
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
                  name="agent_phone"
                  value={agentForm.agent_phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Phone No"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  disabled={isSubmitting}
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
                  name="agent_email"
                  value={agentForm.agent_email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Email Address"
                  required
                  disabled={isSubmitting}
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-envelope"></i>
                </span>
              </div>
            </div>
            <div className="col-md-12 mb-1">
              <label className="form-label">Address</label>
              <textarea
                name="agent_address"
                value={agentForm.agent_address}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Address"
                rows="2"
                required
                disabled={isSubmitting}
              ></textarea>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">State</label>
              <Select
                options={stateOptions}
                name="agent_state"
                value={stateOptions.find(
                  (option) => option.value === agentForm.agent_state
                )}
                onChange={handleStateChange}
                placeholder="Select State"
                isClearable
                isDisabled={isSubmitting}
              />
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">City</label>
              <Select
                options={filteredCityOptions}
                name="agent_city"
                isDisabled={!agentForm.agent_state || isSubmitting}
                value={filteredCityOptions.find(
                  (option) => option.value === agentForm.agent_city
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
                  name="agent_pincode"
                  value={agentForm.agent_pincode}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Pincode"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isSubmitting}
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-map-pin"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label">Commission (%)</label>
              <div className="input-group">
                <input
                  type="number"
                  name="agent_commission"
                  value={agentForm.agent_commission}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Commission"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={isSubmitting}
                />
                <span className="input-group-text bg-primary text-white">
                  %
                </span>
              </div>
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
            aria-label={editingAgentId ? "Update Agent" : "Save Agent"}
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
                {editingAgentId ? "Update Agent" : "Save Agent"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AgentTable;
