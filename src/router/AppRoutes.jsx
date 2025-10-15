import { Route, Routes } from "react-router-dom";

// Authentication
import { LoginPage } from "../pages/authentication/LoginPage";
import { RegisterPage } from "../pages/authentication/RegisterPage";
import { ForgotPasswordPage } from "../pages/authentication/ForgotPasswordPage";

//fabric module
import { FabricTable } from "../pages/fabric/FabricMaster";
import { DesignTable } from "../pages/design/DesignMaster";
import { SalesPerson } from "../pages/sales/SalesPerson";

// cms
import { JobTable } from "../pages/cms/JobMaster";
import { AgentTable } from "../pages/cms/AgentMaster";
import { CustomerTable } from "../pages/cms/CustomerMaster";
import { SupplierTable } from "../pages/cms/SupplierMaster";
import { TransportTable } from "../pages/cms/TransportMaster";

import { PurchaseOrderTable } from "../pages/purchase/PurchaseOrder";
import AddPurchaseItemPage from "../pages/purchase/AddPurchaseItemPage";

import ChallanPage from "../pages/purchase/ChallanPage";
import InvoicePage from "../pages/purchase/ChallanInvoicePage";

import CreateChallanBill from "../pages/purchase/CreateChallanBill";
import CreateChallanInvoice from "../pages/purchase/CreateChallanInvoice";

import { GrayProduction } from "../pages/production/GrayProduction";
import { JobWorkProduction } from "../pages/production/JobWorkProduction";





import { DashboardPage } from "../pages/DashboardPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* fabric */}
      <Route path="/fabric/fabric-master" element={<FabricTable />} />
      <Route path="/design/design-master" element={<DesignTable />} />
      <Route path="/sales/rate-calculator" element={<SalesPerson />} />

      {/* CMS Routes */}
      <Route path="/cms/job-work-master" element={<JobTable />} />
      <Route path="/cms/agent-master" element={<AgentTable />} />
      <Route path="/cms/customer-master" element={<CustomerTable />} />
      <Route path="/cms/supplier-master" element={<SupplierTable />} />
      <Route path="/cms/transport-master" element={<TransportTable />} />

      {/* Purchase Routes */}
      <Route path="/purchase/purchase-bill" element={<PurchaseOrderTable />} />
      <Route path="/purchase/purchase-challan-bill" element={<ChallanPage />} />
      <Route path="/purchase/purchase-invoice-bill" element={<InvoicePage />} />
      <Route path="/create-challan-bill" element={<CreateChallanBill />} />
      <Route path="/create-challan-invoice" element={<CreateChallanInvoice />} />
      <Route path="/add-purchase-item/:purchase_id" element={<AddPurchaseItemPage />} />

      {/* Production Routes */}

      <Route path="/production/gray-production" element={<GrayProduction />} />
      <Route path="/production/job-work-and-production" element={<JobWorkProduction />} />


    </Routes>
  );
};

export default AppRoutes;
