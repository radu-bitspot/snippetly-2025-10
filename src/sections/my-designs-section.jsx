import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Card,
  Menu,
  MenuItem,
  Position,
  Spinner,
  Popover,
  Dialog,
  DialogBody,
  DialogFooter,
  InputGroup,
  FormGroup,
  Classes,
} from '@blueprintjs/core';
import { DocumentOpen, Trash, More, Edit } from '@blueprintjs/icons';

import { SectionTab } from 'polotno/side-panel';
import FaFolder from '@meronex/icons/fa/FaFolder';
import { useProject } from '../project';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';

// Dialog for creating/editing designs
const DesignDialog = ({ isOpen, onClose, onSave, design = null, mode = 'create' }) => {
  const [name, setName] = React.useState(design?.name || '');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName(design?.name || '');
    }
  }, [isOpen, design]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await onSave(name.trim());
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Design' : 'Edit Design'}
      className={Classes.DARK}
    >
      <DialogBody>
        <FormGroup
          label="Design Name"
          labelFor="design-name"
          helperText={mode === 'create' ? 'Enter a name for your new design' : 'Modify the design name'}
        >
          <InputGroup
            id="design-name"
            placeholder="e.g. Event Poster, Company Logo..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            disabled={loading}
          />
        </FormGroup>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              intent="primary"
              onClick={handleSave}
              loading={loading}
              disabled={!name.trim()}
            >
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      />
    </Dialog>
  );
};

const DesignCard = observer(({ design, store, onDelete, onEdit, refreshKey }) => {
  const [loading, setLoading] = React.useState(false);
  const [previewURL, setPreviewURL] = React.useState('');

  React.useEffect(() => {
    // Întotdeauna încarcă preview-ul fresh - cu cache buster pentru a evita cache-ul browser-ului
    console.log('🖼️ DesignCard useEffect triggered for design:', design.id, 'refreshKey:', refreshKey);
    const loadPreview = async () => {
      if (design.previewURL) {
        // URL-ul vine deja cu cache-buster din API (bazat pe updated_at)
        console.log('🖼️ Loading preview URL:', design.previewURL);
        
        // Pentru endpoint-ul Django, trebuie să facem fetch cu autentificare
        try {
          const token = localStorage.getItem('authToken');
          console.log('🖼️ Fetching preview with token:', token ? 'EXISTS' : 'MISSING');
          console.log('🖼️ Fetching URL:', design.previewURL);
          
          const response = await fetch(design.previewURL, {
            headers: {
              'Authorization': `Token ${token}`,
            },
          });
          
          console.log('🖼️ Response status:', response.status);
          console.log('🖼️ Response headers:', Object.fromEntries(response.headers));
          
          if (response.ok) {
            const blob = await response.blob();
            console.log('🖼️ Blob size:', blob.size, 'type:', blob.type);
            const objectURL = URL.createObjectURL(blob);
            console.log('🖼️ Created object URL for preview:', objectURL);
            setPreviewURL(objectURL);
          } else {
            console.error('🖼️ Failed to fetch preview, status:', response.status);
            const errorText = await response.text();
            console.error('🖼️ Error response:', errorText);
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('🖼️ Error fetching preview with auth:', error);
          // Nu seta un URL gol - folosește placeholder
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, 200, 200);
          ctx.fillStyle = '#999';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Loading...', 100, 100);
          setPreviewURL(canvas.toDataURL());
        }
      } else {
        console.log('🖼️ No preview URL in design data, trying API call...');
        try {
          const url = await api.getPreview({ id: design.id });
          if (url) {
            // URL-ul din getPreview este deja un blob URL unic
            console.log('🖼️ Loaded preview from API:', url);
            setPreviewURL(url);
          } else {
            console.log('🖼️ No preview available, using placeholder');
            // Create a simple placeholder
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No Preview', 100, 100);
            setPreviewURL(canvas.toDataURL());
          }
        } catch (e) {
          console.error('🖼️ Failed to load preview:', e);
          setPreviewURL(null);
        }
      }
    };

    loadPreview();
    
    // Cleanup blob URLs pentru a evita memory leaks
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [design.previewURL, design.id, refreshKey]); // Adaugă refreshKey ca dependență

  const handleSelect = async () => {
    setLoading(true);
    window.project.loadById(design.id);
    setLoading(false);
  };

  return (
    <Card
      style={{ margin: '3px', padding: '0px', position: 'relative' }}
      interactive
      onClick={() => {
        handleSelect();
      }}
    >
      <img 
        src={previewURL} 
        style={{ width: '100%', minHeight: '100px', objectFit: 'cover' }}
        onError={(e) => {
          console.error('🖼️ Image failed to load:', previewURL);
          console.error('🖼️ Error details:', e);
          console.error('🖼️ Design data:', design);
          // Create fallback placeholder
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#e0e0e0';
          ctx.fillRect(0, 0, 200, 100);
          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Preview Error', 100, 55);
          e.target.src = canvas.toDataURL();
        }}
      />
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '3px',
        }}
      >
        {design.name || 'Untitled'}
      </div>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Spinner />
        </div>
      )}
      <div
        style={{ position: 'absolute', top: '5px', right: '5px' }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Popover
          content={
            <Menu>
              <MenuItem
                icon={<DocumentOpen />}
                text="Open"
                onClick={() => {
                  handleSelect();
                }}
              />
              <MenuItem
                icon={<Edit />}
                text="Edit Name"
                onClick={() => {
                  onEdit(design);
                }}
              />
              <MenuItem
                icon={<Trash />}
                text="Delete"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this design?')) {
                    onDelete({ id: design.id });
                  }
                }}
              />
            </Menu>
          }
          position={Position.BOTTOM}
        >
          <Button icon={<More />} />
        </Popover>
      </div>
    </Card>
  );
});

export const MyDesignsPanel = observer(({ store }) => {
  const project = useProject();
  const { user } = useAuth(); // Get authenticated user
  const [designsLoadings, setDesignsLoading] = React.useState(false);
  const [designs, setDesigns] = React.useState([]);
  const [message, setMessage] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0); // Key pentru a forța refresh-ul imaginilor
  
  // States for dialogs
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingDesign, setEditingDesign] = React.useState(null);

  // Function to show temporary messages
  const showMessage = (text, duration = 3000) => {
    setMessage(text);
    setTimeout(() => setMessage(''), duration);
  };

  const loadDesigns = async () => {
    setDesignsLoading(true);
    try {
      const result = await api.listDesigns();
      
      // Check if result is an error object
      if (result && result.error) {
        console.warn('API returned error:', result);
        showMessage(`❌ ${result.message}`);
        setDesigns([]);
      } else if (Array.isArray(result)) {
        setDesigns(result);
        console.log('📋 Loaded designs from database:', result.length);
        if (result.length === 0) {
          showMessage('ℹ️ Nu ai design-uri salvate încă. Creează primul tău design!');
        }
      } else {
        console.error('Unexpected API response format:', result);
        showMessage('❌ Format de răspuns neașteptat de la API');
        setDesigns([]);
      }
    } catch (error) {
      console.error('Error loading designs:', error);
      showMessage('❌ Eroare la încărcarea design-urilor');
      setDesigns([]);
    } finally {
      setDesignsLoading(false);
    }
  };

  const handleProjectDelete = async ({ id }) => {
    try {
      await api.deleteDesign({ id });
      setDesigns(designs.filter((design) => design.id !== id));
      showMessage('✅ Design șters cu succes');
    } catch (error) {
      console.error('Error deleting design:', error);
      showMessage('❌ Eroare la ștergerea design-ului');
    }
  };

  // Function for creating a new design with custom name
  const handleCreateDesign = async (name) => {
    try {
      await project.createNewDesign({ name });
      await loadDesigns();
      showMessage(`✅ Design "${name}" creat cu succes`);
    } catch (error) {
      console.error('Error creating design:', error);
      showMessage('❌ Eroare la crearea design-ului');
    }
  };

  // Function for editing a design name
  const handleEditDesign = async (newName) => {
    if (!editingDesign) return;
    
    try {
      // Update name in API
      await api.updateDesign({ id: editingDesign.id, name: newName });
      
      // Update local list
      setDesigns(designs.map(design => 
        design.id === editingDesign.id 
          ? { ...design, name: newName }
          : design
      ));
      
      showMessage(`✅ Design redenumit în "${newName}"`);
    } catch (error) {
      console.error('Failed to update design name:', error);
      showMessage('❌ Eroare la redenumirea design-ului');
      // Reload list on error
      await loadDesigns();
    }
  };

  // Function for opening edit dialog
  const handleOpenEditDialog = (design) => {
    setEditingDesign(design);
    setEditDialogOpen(true);
  };

  React.useEffect(() => {
    // Only load designs if user is authenticated
    if (user) {
      loadDesigns();
    } else {
      // Clear designs when user logs out
      setDesigns([]);
    }
  }, [user, project.designsLength]); // Removed cloudEnabled dependency

  // Ascultă pentru salvări de design-uri și actualizează lista
  React.useEffect(() => {
    const handleDesignSaved = (event) => {
      console.log('🔄 Design saved event received, refreshing designs list...', event.detail);
      // Reîncarcă lista de design-uri pentru a afișa preview-ul actualizat
      if (user) {
        console.log('🔄 User authenticated, reloading designs and refreshing previews...');
        loadDesigns();
        // Incrementează refresh key pentru a forța reîncărcarea imaginilor
        setRefreshKey(prev => {
          const newKey = prev + 1;
          console.log('🔄 Setting refresh key to:', newKey);
          return newKey;
        });
      } else {
        console.log('🔄 No user, skipping refresh');
      }
    };

    window.addEventListener('designSaved', handleDesignSaved);
    
    return () => {
      window.removeEventListener('designSaved', handleDesignSaved);
    };
  }, [user, loadDesigns]);

  const half1 = [];
  const half2 = [];

  designs.forEach((design, index) => {
    if (index % 2 === 0) {
      half1.push(design);
    } else {
      half2.push(design);
    }
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <Button
          fill
          intent="primary"
          onClick={() => setCreateDialogOpen(true)}
          disabled={!user}
        >
          📝 Create New Design
        </Button>
        <Button
          minimal
          onClick={async () => {
            try {
              await project.createNewDesign();
              await loadDesigns();
              showMessage('✅ Design nou creat');
            } catch (error) {
              showMessage('❌ Eroare la crearea design-ului');
            }
          }}
          title="Quick create without name"
          disabled={!user}
        >
          ⚡
        </Button>
      </div>
      
      {/* Authentication warning */}
      {!user && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'rgba(245, 86, 86, 0.1)', 
          border: '1px solid rgba(245, 86, 86, 0.3)',
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          <strong>🔒 Autentificare necesară</strong><br/>
          Trebuie să te autentifici pentru a accesa design-urile din baza de date.
        </div>
      )}
      
      {/* Database info */}
      {user && (
        <div style={{ 
          padding: '10px', 
          textAlign: 'center',
          backgroundColor: 'rgba(15, 153, 96, 0.1)',
          border: '1px solid rgba(15, 153, 96, 0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '10px'
        }}>
          💾 Design-urile sunt salvate în baza de date și accesibile doar pentru contul tău
        </div>
      )}
      
      {!designsLoadings && !designs.length && user && (
        <div style={{ paddingTop: '20px', textAlign: 'center', opacity: 0.6 }}>
          Nu ai design-uri salvate încă...
        </div>
      )}
      {designsLoadings && (
        <div style={{ padding: '30px' }}>
          <Spinner />
        </div>
      )}
      <div
        style={{
          display: 'flex',
          paddingTop: '5px',
          height: '100%',
          overflow: 'auto',
        }}
      >
        <div style={{ width: '50%' }}>
          {half1.map((design) => (
            <DesignCard
              design={design}
              key={design.id}
              store={store}
              onDelete={handleProjectDelete}
              onEdit={handleOpenEditDialog}
              refreshKey={refreshKey}
            />
          ))}
        </div>
        <div style={{ width: '50%' }}>
          {half2.map((design) => (
            <DesignCard
              design={design}
              key={design.id}
              store={store}
              onDelete={handleProjectDelete}
              onEdit={handleOpenEditDialog}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{ 
          margin: '10px 0', 
          padding: '8px', 
          backgroundColor: message.includes('❌') ? 'rgba(245, 86, 86, 0.1)' : 'rgba(15, 153, 96, 0.1)',
          border: `1px solid ${message.includes('❌') ? 'rgba(245, 86, 86, 0.3)' : 'rgba(15, 153, 96, 0.3)'}`,
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Dialog for creating new designs */}
      <DesignDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateDesign}
        mode="create"
      />

      {/* Dialog for editing designs */}
      <DesignDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingDesign(null);
        }}
        onSave={handleEditDesign}
        design={editingDesign}
        mode="edit"
      />
    </div>
  );
});

// define the new custom section
export const MyDesignsSection = {
  name: 'my-designs',
  Tab: (props) => (
    <SectionTab name="My Designs" {...props}>
      <FaFolder />
    </SectionTab>
  ),
  // we need observer to update component automatically on any store changes
  Panel: MyDesignsPanel,
};
