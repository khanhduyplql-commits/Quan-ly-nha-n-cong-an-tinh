import React, { useState, useEffect } from 'react';
import { RestaurantProvider, useRestaurant, ROLE_CONFIGS } from './context/RestaurantContext';
import { ActiveTab } from './types';
import { Navbar } from './components/Navbar';
import { CounterPOS } from './components/POS/CounterPOS';
import { TableMapPOS } from './components/POS/TableMapPOS';
import { KitchenKDS } from './components/Kitchen/KitchenKDS';
import { CashflowManagement } from './components/Cashflow/CashflowManagement';
import { MenuAdmin } from './components/MenuAdmin/MenuAdmin';
import { TechGuide } from './components/Guide/TechGuide';
import { AiMenuAssistant } from './components/Customer/AiMenuAssistant';
import { AccessDeniedView } from './components/Auth/AccessDeniedView';
import { RoleSwitchModal } from './components/Auth/RoleSwitchModal';

function MainContent() {
  const { userRole, isRoleAllowedTab } = useRestaurant();
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.admin;

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return roleConfig.defaultTab;
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // When role changes, if current tab is not allowed, switch to default allowed tab
  useEffect(() => {
    if (!isRoleAllowedTab(userRole, activeTab)) {
      setActiveTab(roleConfig.defaultTab);
    }
  }, [userRole, activeTab, isRoleAllowedTab, roleConfig.defaultTab]);

  const isAllowed = isRoleAllowedTab(userRole, activeTab);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          {!isAllowed ? (
            <AccessDeniedView
              attemptedTab={activeTab}
              onOpenRoleSwitch={() => setIsRoleModalOpen(true)}
            />
          ) : (
            <>
              {activeTab === 'pos_counter' && <CounterPOS />}
              {activeTab === 'tables' && (
                <TableMapPOS
                  onSelectTableForPos={(_tableNum) => {
                    setActiveTab('pos_counter');
                  }}
                />
              )}
              {activeTab === 'kitchen' && <KitchenKDS />}
              {activeTab === 'cashflow' && <CashflowManagement />}
              {activeTab === 'menu_manage' && <MenuAdmin />}
              {activeTab === 'guide' && <TechGuide />}
            </>
          )}
        </div>
      </main>

      {/* Global AI Sommelier / Menu Advisor Modal */}
      <AiMenuAssistant
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Role Switch & Login Modal */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onRoleChanged={(newRole) => {
          const cfg = ROLE_CONFIGS[newRole];
          if (!cfg.allowedTabs.includes(activeTab)) {
            setActiveTab(cfg.defaultTab);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <MainContent />
    </RestaurantProvider>
  );
}
