import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../services/api";
import { Helmet } from "react-helmet-async";
import { debounce } from "lodash";
import { Modal, Button } from "react-bootstrap";
import { toast } from 'react-toastify';
import Select from "react-select";

// Reusable Spinner Component
const Spinner = ({ message = "Loading..." }) => (
  <div className="d-flex justify-content-center align-items-center p-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">{message}</span>
    </div>
  </div>
);

export const CustomerTable = () => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [filteredCityOptions, setFilteredCityOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [customerTypeOptions, setCustomerTypeOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Centralized error handling
  const handleApiError = (error, defaultMessage) => {
    console.error("API Error:", error);
    toast.error(error.response?.data?.message || defaultMessage);
  };

  const fetchStateOptions = async () => {
    try {
      const response = await api.get("/api/get-states");
      if (response.data && Array.isArray(response.data)) {
        const formattedStates = response.data.map((state) => ({
          value: state.id,
          label: state.name,
        }));
        setStateOptions(formattedStates);
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
      if (response.data && Array.isArray(response.data)) {
        const formattedCities = response.data.map((city) => ({
          value: city.id,
          label: city.name,
          stateId: city.state_id,
        }));
        setCityOptions(formattedCities);
      } else {
        toast.error("Failed to load cities.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching cities.");
    }
  };

  const fetchCustomerTypeOptions = async () => {
    try {
      const response = await api.get("/api/get-customer-type");
      if (response.data && Array.isArray(response.data)) {
        const formattedType = response.data.map((type) => ({
          value: type.id,
          label: type.name,
        }));
        setCustomerTypeOptions(formattedType);
      } else {
        toast.error("Failed to load customer.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching customer types.");
    }
  };

  const fetchCustomerData = useCallback(
    async (page = 1, search = "", perPageCount = perPage) => {
      setPageLoading(true);
      try {
        const response = await api.get("/api/fetch-customer-table-data", {
          params: {
            page,
            search,
            per_page: perPageCount,
          },
        });

        if (!response.data) {
          throw new Error("No data received from API.");
        }

        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        setCustomerData(data);
        setPagination({
          currentPage: response.data.pagination?.current_page || 1,
          lastPage: response.data.pagination?.last_page || 1,
          total: response.data.pagination?.total || data.length || 0,
          from: response.data.pagination?.from || 1,
          to: response.data.pagination?.to || data.length || 0,
        });
      } catch (error) {
        handleApiError(error, "Failed to fetch customer data.");
        setCustomerData([]);
      } finally {
        setPageLoading(false);
      }
    },
    [perPage, handleApiError]
  );

  const [customerForm, setCustomerForm] = useState({
    customer_name: "",
    customer_company_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_state: "",
    customer_city: "",
    customer_pincode: "",
    customer_gst_no: "",
    customer_type_id: "",
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCustomerData(),
        fetchStateOptions(),
        fetchCityOptions(),
        fetchCustomerTypeOptions(),
      ]);
    } catch (error) {
      handleApiError(error, "Failed to load initial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleStateChange = (selectedOption) => {
    setCustomerForm({
      ...customerForm,
      customer_state: selectedOption?.value || "",
      customer_city: "",
    });
    const filteredCities = cityOptions.filter(
      (city) => city.stateId === selectedOption?.value
    );
    setFilteredCityOptions(filteredCities);
  };

  const handleCityChange = (selectedOption) => {
    setCustomerForm({
      ...customerForm,
      customer_city: selectedOption?.value || "",
    });
  };

  const handleCustomerTypeChange = (selectedOption) => {
    setCustomerForm({
      ...customerForm,
      customer_type_id: selectedOption?.value || "",
    });
  };

  const handleChange = (e) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  const handlePageChange = (page) => {
    if (
      page > 0 &&
      page <= pagination.lastPage &&
      page !== pagination.currentPage
    ) {
      fetchCustomerData(page, searchText);
    }
  };

  const validateForm = () => {
    const {
      customer_name,
      customer_company_name,
      customer_phone,
      customer_email,
      customer_state,
      customer_city,
      customer_type_id,
      customer_pincode,
    } = customerForm;

    if (
      !customer_name ||
      !customer_company_name ||
      !customer_phone ||
      !customer_email ||
      !customer_state ||
      !customer_city ||
      !customer_type_id
    ) {
      toast.warning("Please fill in all required fields.");
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customer_phone)) {
      toast.warning("Please enter a valid 10-digit phone number.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      toast.warning("Please enter a valid email address.");
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (customer_pincode && !pincodeRegex.test(customer_pincode)) {
      toast.warning("Please enter a valid 6-digit pincode.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = editingCustomerId
        ? `/api/update-customer-data/${editingCustomerId}`
        : "/api/store-customer-data";
      await api.post(url, customerForm);
      toast.success(
        `Customer ${editingCustomerId ? "updated" : "added"} successfully!`
      );
      fetchCustomerData(pagination.currentPage);
      setShowModal(false);
      resetForm();
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        handleApiError(error, "This Customer name already exists.");
      } else if (status === 422) {
        handleApiError(error, "Please fix the validation errors.");
      } else {
        handleApiError(error, "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const editCustomer = async (customerId) => {
    try {
      const response = await api.get(`/api/get-customer-data/${customerId}`);
      if (response.data?.data) {
        const stateId = response.data.data.state_id || "";
        const filteredCities = cityOptions.filter(
          (city) => city.stateId === stateId
        );
        setFilteredCityOptions(filteredCities);
        setCustomerForm({
          customer_name: response.data.data.customer_name || "",
          customer_company_name: response.data.data.customer_company_name || "",
          customer_phone: response.data.data.customer_phone || "",
          customer_email: response.data.data.customer_email || "",
          customer_address: response.data.data.customer_address || "",
          customer_state: stateId,
          customer_city: response.data.data.city_id || "",
          customer_pincode: response.data.data.customer_pincode || "",
          customer_gst_no: response.data.data.customer_gst_no || "",
          customer_type_id: response.data.data.customer_type_id || "",
        });
        setEditingCustomerId(customerId);
        setShowModal(true);
      } else {
        handleApiError(null, "Customer data not found.");
      }
    } catch (error) {
      handleApiError(error, "Error fetching customer data.");
    }
  };

  const deleteCustomer = async (customerId) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      const response = await api.delete(`/api/delete-customer/${customerId}`);
      if (response.status === 200) {
        toast.success("Customer deleted successfully!");
        setCustomerData((prevData) =>
          prevData.filter((customer) => customer.customer_id !== customerId)
        );
      } else {
        handleApiError(null, "Failed to delete customer.");
      }
    } catch (error) {
      handleApiError(error, "Error deleting customer.");
    }
  };

  const debouncedFetchCustomerData = useMemo(
    () =>
      debounce((page, search, perPageCount) => {
        fetchCustomerData(page, search, perPageCount);
      }, 500),
    [fetchCustomerData]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value.trim();
    setSearchText(value);
    debouncedFetchCustomerData(1, value, perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const clearSearch = () => {
    setSearchText("");
    fetchCustomerData(1, "", perPage);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleShow = () => {
    setShowModal(true);
  };

  const resetForm = () => {
    setCustomerForm({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      customer_state: "",
      customer_city: "",
      customer_pincode: "",
      customer_gst_no: "",
      customer_type_id: "",
    });
    setFilteredCityOptions([]);
    setEditingCustomerId(null);
  };

  return (
    <>
      <Helmet>
        <title>ERP | Customer Master</title>
      </Helmet>
      <div className="card">
        <h5 className="card-header d-flex justify-content-between align-items-center flex-wrap">
          <span>Basic Info Customer Details</span>
          <div className="btn-group mt-2 mt-md-0">
            <button
              aria-label="Manage Customer"
              type="button"
              className="btn btn-primary btn-sm dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-user"></i>&nbsp;Manage Customer
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  aria-label="Add Customer"
                  className="dropdown-item"
                  onClick={handleShow}
                >
                  <i className="bx bx-user"></i> Add Customer
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  aria-label="Import Customer"
                  className="dropdown-item"
                  href="#"
                >
                  <i className="bx bx-cloud-upload"></i> Import
                </a>
              </li>
              <li>
                <a
                  aria-label="Export Customer"
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
                fetchCustomerData(1, searchText, value);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </select>
          </div>
          <div
            className="d-flex align-items-center gap-2"
            style={{ maxWidth: "200px", width: "100%" }}
          >
            <input
              type="text"
              className="form-control form-control-sm fw-semibold"
              placeholder="Search Customer Name"
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Search Customer Name"
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
          ) : customerData.length > 0 ? (
            <>
              <table className="table table-hover text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">Sr.</th>
                    <th>Customer</th>
                    <th>Company</th>
                    <th>Phone No</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Customer Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLoading ? (
                    <tr>
                      <td colSpan="8" className="text-center p-5">
                        <Spinner message="Loading..." />
                      </td>
                    </tr>
                  ) : customerData.length > 0 ? (
                    customerData.map((customer, index) => (
                      <tr key={customer.customer_id || index}>
                        <td className="text-center">{index + 1}</td>
                        <td>{customer.customer_name || "N/A"}</td>
                        <td>{customer.customer_company_name || "N/A"}</td>
                        <td>{customer.customer_phone || "N/A"}</td>
                        <td>{customer.customer_email || "N/A"}</td>
                        <td>{customer.city || "N/A"}</td>
                        <td>{customer.type_name || "N/A"}</td>
                        <td>
                          <div className="dropdown">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm dropdown-toggle hide-arrow"
                              data-bs-toggle="dropdown"
                              aria-label="Customer Actions"
                            >
                              <i className="bx bx-down-arrow-circle"></i>
                            </button>
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item ms-2"
                                onClick={() =>
                                  editCustomer(customer.customer_id)
                                }
                                aria-label="Edit Customer"
                              >
                                <i className="bx bx-edit-alt"></i> Edit
                              </button>
                              <button
                                className="dropdown-item ms-2"
                                onClick={() =>
                                  deleteCustomer(customer.customer_id)
                                }
                                aria-label="Delete Customer"
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
                      <td colSpan="8" className="text-center">
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
        onHide={() => {
          setShowModal(false);
          resetForm();
        }}
        aria-labelledby="customerModalTitle"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="customerModalTitle">
            {editingCustomerId
              ? "Edit Customer and Supplier"
              : "Create Customer & Supplier Master"}
          </Modal.Title>
        </Modal.Header>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Body>
          <div className="row g-2">
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="customer_name">
                Customer Name <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="customer_name"
                  id="customer_name"
                  value={customerForm.customer_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Customer Name"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-user"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="customer_company_name">
                Company Name <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="customer_company_name"
                  id="customer_company_name"
                  value={customerForm.customer_company_name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Company Name"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-buildings"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="customer_phone">
                Phone No <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="customer_phone"
                  id="customer_phone"
                  value={customerForm.customer_phone}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Phone No"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-phone"></i>
                </span>
              </div>
            </div>
            <div className="col-md-6 mb-1">
              <label className="form-label" htmlFor="customer_email">
                Email <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="email"
                  name="customer_email"
                  id="customer_email"
                  value={customerForm.customer_email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Email Address"
                  required
                  aria-required="true"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-envelope"></i>
                </span>
              </div>
            </div>
            <div className="col-md-12 mb-1">
              <label className="form-label" htmlFor="customer_address">
                Address <span className="text-danger">*</span>
              </label>
              <textarea
                name="customer_address"
                id="customer_address"
                value={customerForm.customer_address}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter Address"
                rows="2"
                required
                aria-required="true"
              ></textarea>
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="customer_state">
                State <span className="text-danger">*</span>
              </label>
              <Select
                options={stateOptions}
                value={stateOptions.find(
                  (option) => option.value === customerForm.customer_state
                )}
                onChange={handleStateChange}
                placeholder="Select State"
                isClearable
                inputId="customer_state"
                aria-required="true"
              />
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="customer_city">
                City <span className="text-danger">*</span>
              </label>
              <Select
                options={filteredCityOptions}
                value={filteredCityOptions.find(
                  (option) => option.value === customerForm.customer_city
                )}
                onChange={handleCityChange}
                placeholder="Select City"
                isClearable
                inputId="customer_city"
                aria-required="true"
              />
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="customer_pincode">
                Pincode
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="customer_pincode"
                  id="customer_pincode"
                  value={customerForm.customer_pincode}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter Pincode"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bx-map-pin"></i>
                </span>
              </div>
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="customer_gst_no">
                GST No
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="customer_gst_no"
                  id="customer_gst_no"
                  value={customerForm.customer_gst_no}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter GST No"
                  maxLength={15}
                  pattern="[0-9A-Z]{15}"
                />
                <span className="input-group-text bg-primary text-white">
                  <i className="bx bxs-dice-2"></i>
                </span>
              </div>
            </div>
            <div className="col-md-4 mb-1">
              <label className="form-label" htmlFor="customer_type_id">
                Select Type <span className="text-danger">*</span>
              </label>
              <Select
                options={customerTypeOptions}
                value={customerTypeOptions.find(
                  (option) => option.value === customerForm.customer_type_id
                )}
                onChange={handleCustomerTypeChange}
                placeholder="Search or select type"
                isClearable
                isSearchable
                inputId="customer_type_id"
                className={!customerForm.customer_type_id ? "is-invalid" : ""}
                aria-required="true"
              />
            </div>
          </div>
        </Modal.Body>
        <hr className="mt-0 mb-0 shadow-sm" />
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            aria-label="Close Modal"
          >
            <i className="bx bx-window-close"></i> Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-label={editingCustomerId ? "Update Customer" : "Save Customer"}
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
                {editingCustomerId ? "Update Customer" : "Save Customer"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CustomerTable;
