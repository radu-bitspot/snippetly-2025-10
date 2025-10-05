import React from 'react';
import { Dialog, Classes, Button, InputGroup, TextArea, Intent } from '@blueprintjs/core';
import { Plus } from '@blueprintjs/icons';

const AddDesignModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    prompt: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        prompt: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Numele este obligatoriu';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrierea este obligatorie';
    }
    
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt-ul este obligatoriu';
    } else if (!formData.prompt.includes('{userPrompt}')) {
      newErrors.prompt = 'Prompt-ul trebuie să conțină {userPrompt} pentru tema utilizatorului';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique key from name
      const key = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const designTemplate = {
        key,
        name: formData.name.trim(),
        description: formData.description.trim(),
        prompt: formData.prompt.trim()
      };
      
      await onSave(designTemplate);
      onClose();
    } catch (error) {
      console.error('Error saving design template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Adaugă Stil Nou"
      icon={<Plus />}
      style={{ width: '600px' }}
      className={Classes.DARK}
    >
      <div className={Classes.DIALOG_BODY}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Numele stilului *
          </label>
          <InputGroup
            placeholder="ex: Vintage Poster"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            intent={errors.name ? Intent.DANGER : Intent.NONE}
          />
          {errors.name && (
            <div style={{ color: '#F55656', fontSize: '12px', marginTop: '3px' }}>
              {errors.name}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Descrierea scurtă *
          </label>
          <TextArea
            placeholder="Descriere scurtă a stilului care va apărea utilizatorilor..."
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
            intent={errors.description ? Intent.DANGER : Intent.NONE}
          />
          {errors.description && (
            <div style={{ color: '#F55656', fontSize: '12px', marginTop: '3px' }}>
              {errors.description}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Prompt-ul complet *
          </label>
          <TextArea
            placeholder={`Creează o imagine în stil...\n\nElemente cheie:\n- Caracteristică 1\n- Caracteristică 2\n\nTema/subiect: {userPrompt}`}
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            rows={8}
            style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
            intent={errors.prompt ? Intent.DANGER : Intent.NONE}
          />
          {errors.prompt && (
            <div style={{ color: '#F55656', fontSize: '12px', marginTop: '3px' }}>
              {errors.prompt}
            </div>
          )}
          <div style={{ fontSize: '11px', color: '#8A9BA8', marginTop: '5px' }}>
            💡 Tip: Folosește {'{userPrompt}'} unde vrei să apară prompt-ul utilizatorului
          </div>
        </div>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Anulează
          </Button>
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSave}
            loading={isSubmitting}
            disabled={!formData.name.trim() || !formData.description.trim() || !formData.prompt.trim()}
          >
            Salvează Stilul
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default AddDesignModal; 