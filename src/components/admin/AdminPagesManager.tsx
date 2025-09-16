import { useState } from "react";
import { AdminPagesOverview } from "./AdminPagesOverview";
import { FullPageEditor } from "./FullPageEditor";

export function AdminPagesManager() {
  const [currentView, setCurrentView] = useState<'overview' | 'editor'>('overview');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const handleCreatePage = () => {
    setEditingPageId('new');
    setCurrentView('editor');
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setCurrentView('editor');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setEditingPageId(null);
  };

  if (currentView === 'editor') {
    return (
      <FullPageEditor 
        pageId={editingPageId}
        onBack={handleBackToOverview}
      />
    );
  }

  return (
    <AdminPagesOverview 
      onCreatePage={handleCreatePage}
      onEditPage={handleEditPage}
    />
  );
}