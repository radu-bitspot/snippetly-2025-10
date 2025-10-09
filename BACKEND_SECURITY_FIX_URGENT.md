# 🚨 BACKEND SECURITY FIX - URGENT!

## ⚠️ **PROBLEMA CRITICĂ**

**Backend-ul Django returnează TOATE design-urile către TOȚI utilizatorii!**

Orice utilizator autentificat poate vedea design-urile altor utilizatori. Aceasta este o **vulnerabilitate de securitate majoră**!

---

## ✅ **SOLUȚIA TEMPORARĂ (Frontend) - APLICATĂ**

Am adăugat un **filtru temporar pe frontend** în `src/api.js` care filtrează design-urile pe `userId`, dar aceasta este doar o măsură temporară. **Backend-ul TREBUIE fixat urgent!**

---

## 🔧 **FIX OBLIGATORIU PE BACKEND DJANGO**

### **1. Verifică modelul Design**

```python
# models.py

from django.db import models
from django.contrib.auth.models import User

class Design(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # TREBUIE să existe!
    name = models.CharField(max_length=255)
    store_json = models.JSONField()
    preview_data = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
```

**Dacă `user` field lipsește, adaugă-l:**

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### **2. Filtrare QuerySet în ViewSet/View**

**Locație**: `views.py` sau `viewsets.py`

**❌ COD CURENT (GREȘIT - PERICULOS):**
```python
class DesignViewSet(viewsets.ModelViewSet):
    queryset = Design.objects.all()  # ❌ RETURNEAZĂ TOATE DESIGN-URILE!
    serializer_class = DesignSerializer
```

**✅ COD CORECT (FIX APLICAT):**
```python
class DesignViewSet(viewsets.ModelViewSet):
    serializer_class = DesignSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """DOAR design-urile userului autentificat"""
        return Design.objects.filter(user=self.request.user)
```

---

### **3. Setare User la Creare**

**❌ COD CURENT (GREȘIT):**
```python
# User-ul nu este setat automat, sau poate fi override-uit din request
```

**✅ COD CORECT (FIX APLICAT):**
```python
class DesignViewSet(viewsets.ModelViewSet):
    # ... (cod de mai sus)
    
    def perform_create(self, serializer):
        """Setează user-ul automat din request"""
        serializer.save(user=self.request.user)
```

---

### **4. Verificare Ownership la Retrieve/Update/Delete**

**✅ COD RECOMANDAT:**
```python
class DesignViewSet(viewsets.ModelViewSet):
    # ... (cod de mai sus)
    
    def get_object(self):
        """Verifică că user-ul are permisiunea să acceseze design-ul"""
        obj = super().get_object()
        if obj.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nu ai permisiunea să accesezi acest design!")
        return obj
```

---

### **5. Preview Endpoint Security**

**Verifică endpoint-ul de preview:**

```python
class DesignViewSet(viewsets.ModelViewSet):
    # ... (cod de mai sus)
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Preview-ul verifică ownership prin get_object()"""
        design = self.get_object()  # Folosește get_object() care verifică ownership
        
        # Returnează preview ca răspuns HTTP
        if design.preview_data:
            import base64
            from django.http import HttpResponse
            
            # Dacă preview_data este base64
            if design.preview_data.startswith('data:image'):
                # Extract base64 part
                preview_base64 = design.preview_data.split(',')[1]
                preview_bytes = base64.b64decode(preview_base64)
                return HttpResponse(preview_bytes, content_type='image/jpeg')
            else:
                # Dacă este deja binary
                return HttpResponse(design.preview_data, content_type='image/jpeg')
        
        return Response({'error': 'No preview available'}, status=404)
```

---

### **6. Serializer - Include User ID**

**Verifică serializer-ul:**

```python
# serializers.py

from rest_framework import serializers
from .models import Design

class DesignSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)  # Include user ID
    # SAU
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Design
        fields = ['id', 'name', 'user', 'store_json', 'preview_data', 
                  'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
```

**Important**: `user` sau `user_id` trebuie să fie în răspunsul JSON pentru ca frontend-ul să poată verifica!

---

## 📝 **COD COMPLET - COPY-PASTE READY**

```python
# views.py sau viewsets.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.http import HttpResponse
import base64

from .models import Design
from .serializers import DesignSerializer

class DesignViewSet(viewsets.ModelViewSet):
    """
    ViewSet pentru gestionarea design-urilor.
    Fiecare user vede doar design-urile proprii.
    """
    serializer_class = DesignSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        IMPORTANT: Returnează DOAR design-urile userului autentificat.
        Aceasta este prima linie de apărare împotriva accesului neautorizat.
        """
        return Design.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """
        IMPORTANT: Setează user-ul automat la creare.
        User-ul nu poate fi override-uit din request.
        """
        serializer.save(user=self.request.user)
    
    def get_object(self):
        """
        IMPORTANT: Verifică ownership pentru retrieve/update/delete.
        Previne accesul la design-urile altor useri chiar dacă au ID-ul.
        """
        obj = super().get_object()
        if obj.user != self.request.user:
            raise PermissionDenied("Nu ai permisiunea să accesezi acest design!")
        return obj
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """
        IMPORTANT: Preview-ul verifică ownership.
        Folosește get_object() care verifică automat ownership.
        """
        design = self.get_object()  # Verifică ownership automat
        
        if design.preview_data:
            # Dacă preview_data este base64 (format: data:image/jpeg;base64,...)
            if design.preview_data.startswith('data:image'):
                preview_base64 = design.preview_data.split(',')[1]
                preview_bytes = base64.b64decode(preview_base64)
                return HttpResponse(preview_bytes, content_type='image/jpeg')
            else:
                # Dacă este deja binary sau text
                return HttpResponse(design.preview_data, content_type='image/jpeg')
        
        return Response({'error': 'No preview available'}, status=404)
```

```python
# serializers.py

from rest_framework import serializers
from .models import Design

class DesignSerializer(serializers.ModelSerializer):
    """
    Serializer pentru Design model.
    User este read-only și setat automat în perform_create.
    """
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Design
        fields = ['id', 'name', 'user', 'store_json', 'preview_data', 
                  'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_store_json(self, value):
        """Validare opțională pentru store_json"""
        # Asigură-te că este JSON valid
        if isinstance(value, str):
            import json
            try:
                json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format")
        return value
```

---

## 🧪 **TESTARE DUPĂ FIX**

### **Test 1: Filtrare QuerySet**
```bash
# În Django shell
python manage.py shell

from yourapp.models import Design
from django.contrib.auth.models import User

user1 = User.objects.get(id=1)
user2 = User.objects.get(id=2)

# Creează design pentru user1
Design.objects.create(user=user1, name="User1 Design", store_json={})

# Creează design pentru user2
Design.objects.create(user=user2, name="User2 Design", store_json={})

# Verifică că fiecare user vede doar design-urile sale
print("User1 designs:", Design.objects.filter(user=user1).count())  # Ar trebui să fie 1
print("User2 designs:", Design.objects.filter(user=user2).count())  # Ar trebui să fie 1
```

### **Test 2: API Endpoint**
```bash
# Test cu curl sau Postman

# 1. Login ca User1
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"password"}'

# Salvează token-ul: TOKEN1=...

# 2. Verifică design-uri User1
curl -X GET http://localhost:8000/api/designs/ \
  -H "Authorization: Token TOKEN1"

# Ar trebui să returneze DOAR design-urile User1!

# 3. Login ca User2 și verifică
# Ar trebui să returneze DOAR design-urile User2!
```

---

## ⚡ **PAȘI DE IMPLEMENTARE**

1. **Backup database** (important!)
   ```bash
   python manage.py dumpdata > backup.json
   ```

2. **Aplică fix-urile**
   - Modifică `views.py` / `viewsets.py`
   - Modifică `serializers.py`

3. **Testează local**
   - Rulează testele automate
   - Testează manual cu 2 useri diferiți

4. **Deploy**
   ```bash
   git add .
   git commit -m "SECURITY FIX: Filter designs by user"
   git push
   ```

5. **Verifică în producție**
   - Login cu 2 conturi diferite
   - Confirmă că fiecare vede doar design-urile proprii

---

## 🚨 **IMPACT SECURITY**

### **Fără Fix:**
- ❌ User A vede design-urile User B
- ❌ User A poate descărca design-urile User B
- ❌ User A poate vedea preview-urile User B
- ❌ Posibil: User A să modifice/șteargă design-urile User B

### **Cu Fix:**
- ✅ User A vede DOAR design-urile proprii
- ✅ User A poate accesa DOAR preview-urile proprii
- ✅ User A poate modifica DOAR design-urile proprii
- ✅ Design-urile sunt complet izolate per user

---

## 📋 **CHECKLIST FINAL**

- [ ] Model `Design` are field `user` (ForeignKey)
- [ ] `get_queryset()` filtrează pe `user=self.request.user`
- [ ] `perform_create()` setează `user=self.request.user`
- [ ] `get_object()` verifică ownership
- [ ] `preview` endpoint folosește `get_object()`
- [ ] Serializer include `user` în response
- [ ] Permission classes setate la `[IsAuthenticated]`
- [ ] Testat cu 2 useri diferiți
- [ ] Verificat în producție

---

**URGENT! Implementează aceste fix-uri cât mai curând posibil!**

**Data**: ${new Date().toLocaleDateString()}
**Prioritate**: 🚨 CRITICĂ
**Status**: ⚠️ VULNERABILITATE ACTIVĂ

