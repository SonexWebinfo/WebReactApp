import React, { useState } from "react";
import { Card } from "react-bootstrap";

export const GrayProduction = () => {
    const [activeTab, setActiveTab] = useState("basic");

    const handleTabClick = (tab) => setActiveTab(tab);

    return (
        <div className="col-md-12 mb-4">
            <Card className="shadow-sm border-0">
                <h5 className="card-header bg-white fw-semibold text-center">
                    Production Tabs
                </h5>

                {/* Tabs Header */}
                <div className="card-body border-bottom pb-0">
                    <ul
                        className="nav nav-tabs justify-content-center mb-3 border-0"
                        style={{ gap: "1rem" }}
                    >
                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "basic"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("basic")}
                            >
                                <i className="bx bx-home me-1"></i> Gray
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "details"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("details")}
                            >
                                <i className="bx bx-info-circle me-1"></i> RFD
                            </button>
                        </li>

                        <li className="nav-item">
                            <button
                                className={`nav-link fw-semibold px-4 py-2 rounded-pill ${activeTab === "settings"
                                    ? "active bg-primary text-white shadow-sm"
                                    : "text-primary border border-primary bg-transparent"
                                    }`}
                                onClick={() => handleTabClick("settings")}
                            >
                                <i className="bx bx-cog me-1"></i> Coating
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Tab Content */}
                <div className="card-body text-center">
                    {activeTab === "basic" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">
                                Gray Production
                            </h6>
                            <p className="text-muted mb-0">
                                This is the Gray Production tab content. Add your component here.
                            </p>
                        </div>
                    )}

                    {activeTab === "details" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">RFD Section</h6>
                            <p className="text-muted mb-0">
                                You can load details form, data table, etc. here.
                            </p>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div>
                            <h6 className="fw-semibold mb-2 text-primary">Coating Section</h6>
                            <p className="text-muted mb-0">
                                Settings or Coating-related UI can go here.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default GrayProduction;
