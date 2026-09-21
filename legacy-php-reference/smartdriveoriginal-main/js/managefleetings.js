/**
 * Checks if the currently logged-in user is an administrator.
 * If not, it redirects them to the login page.
 * If they are an admin, it updates the authentication buttons to show a logout option.
 */
let fleetSearchTerm = '';

function checkAdmin() {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (!user || user.email !== 'admin@smartrentals.com') {
        window.location.href = 'login.php';
      } else {
        // If the user is an admin, display the logout button.
        document.getElementById('auth-buttons').innerHTML = `<button onclick="logout()" class="btn-login">Logout</button>`;
      }
    }
    /**
     * Logs the user out by clearing their session data and redirecting to the home page.
     */
    function logout() {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('isNewUser');
      localStorage.removeItem('smartdriveUser');
      localStorage.removeItem('smartdriveUsers');
      window.location.href = 'index.php';
    }

    function normalizeVehicleRecord(vehicle) {
     const id = vehicle.id ?? vehicle.vehicle_id ?? vehicle.vehicleId ?? String(vehicle.vehicle_id || Date.now());
     return {
       ...vehicle,
       id: String(id),
       vehicle_id: vehicle.vehicle_id ?? String(id),
       name: vehicle.name || 'Unnamed Vehicle',
       type: vehicle.type || 'Unknown',
       price: Number(vehicle.price ?? vehicle.daily_rate ?? 0),
       image: vehicle.image || '',
       status: vehicle.status || 'available',
       main_category: vehicle.main_category || vehicle.type || 'Cars'
     };
    }

    async function getSupabaseVehicles() {
     if (!window.smartdriveSupabase) return null;

     try {
       const { data, error } = await window.smartdriveSupabase
         .from('vehicles')
         .select('*')
         .order('created_at', { ascending: false });

       if (error) {
         const isMissingTable = /does not exist|relation .* does not exist|not found/i.test(error.message);
         if (isMissingTable) return [];
         throw new Error(`Unable to read vehicles from Supabase: ${error.message}`);
       }

       return Array.isArray(data) ? data.map(normalizeVehicleRecord) : [];
     } catch (error) {
       throw error instanceof Error ? error : new Error('Supabase vehicle query failed.');
     }
    }

    /**
     * Loads vehicle data from storage, filters it into active and archived lists,
     * and renders them into their respective tables on the page.
     */
    async function loadFleetData() {
       const activeTbody = document.getElementById('fleet-list-body');
       const archivedTbody = document.getElementById('archived-fleet-list-body');
       // Clear existing table data before rendering new data.
       activeTbody.innerHTML = '';
       archivedTbody.innerHTML = '';
       try {
         const supabaseVehicles = await getSupabaseVehicles();
         if (supabaseVehicles !== null) {
           // Keep the existing fleet visible until Supabase has been seeded.
           CARS = supabaseVehicles.length > 0
             ? supabaseVehicles
             : getFleet().map(normalizeVehicleRecord);
           VEHICLES = CARS;
           localStorage.setItem('fleetData', JSON.stringify(CARS));
         } else {
           const response = await fetch('api/vehicles.php');
           const result = await response.json();
           if (!response.ok || !result.success) throw new Error(result.message || 'Could not load vehicles.');
           CARS = Array.isArray(result.vehicles) ? result.vehicles.map(normalizeVehicleRecord) : getFleet();
           VEHICLES = CARS;
           localStorage.setItem('fleetData', JSON.stringify(CARS));
         }
       } catch (error) {
         console.error('Could not load vehicles from database.', error);
         CARS = getFleet().map(normalizeVehicleRecord);
         VEHICLES = CARS;
         localStorage.setItem('fleetData', JSON.stringify(CARS));
       }

       const normalizedSearch = fleetSearchTerm.trim().toLowerCase();
        const matchesSearch = car => !normalizedSearch || [
          car.name, car.type, car.id, car.plateNumber, car.plate_number
        ].some(value => String(value || '').toLowerCase().includes(normalizedSearch));
        const activeVehicles = CARS.filter(car => car.status !== 'archived' && matchesSearch(car));
        const archivedVehicles = CARS.filter(car => car.status === 'archived' && matchesSearch(car));
        document.getElementById('total-vehicles-count').textContent = activeVehicles.length;

        // Render active vehicles
        if (activeVehicles.length === 0) {
            activeTbody.innerHTML = `<tr><td colspan="5" class="text-center p-12 text-muted-foreground">No active vehicles in the fleet.</td></tr>`;
        } else {
            activeVehicles.forEach(car => {
                const row = document.createElement('tr');
                // The "archive" button is styled as a destructive action (red).
                const actionButton = `<button class="btn-icon delete-vehicle-btn" data-id="${car.id}" title="Delete" style="background-color: rgba(255, 69, 58, 0.1); color: var(--destructive);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>`;

                row.innerHTML = `
                  <td>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                      <img src="${car.image}" alt="${car.name}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 0.5rem;">
                      <span style="font-weight: 600; color: var(--foreground);">${car.name}</span>
                    </div>
                  </td>
                  <td style="color: var(--foreground);">${car.type}</td>
                  <td style="color: var(--foreground);">₱${car.price.toLocaleString()}</td>
                  <td><span class="text-primary font-semibold">Available</span></td>
                  <td class="action-cell" style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon edit-vehicle-btn" data-id="${car.id}" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>`
                    + actionButton +
                  `
                  </td>
                `;
                activeTbody.appendChild(row);
            });
        }

        // Render archived vehicles
        if (archivedVehicles.length === 0) {
            archivedTbody.innerHTML = `<tr><td colspan="5" class="text-center p-12 text-muted-foreground">No archived vehicles.</td></tr>`;
            return;
        } else {
          archivedVehicles.forEach(car => {
            const row = document.createElement('tr');
            // Apply styles to visually distinguish archived vehicles.
            row.style.opacity = '0.6';
            row.style.background = 'rgba(255, 255, 255, 0.02)';

            // The "recover" button is styled as a constructive action (green).
            const actionButton = `<button class="btn-icon recover-vehicle-btn" data-id="${car.id}" title="Recover" style="background-color: rgba(168, 85, 247, 0.1); color: var(--primary);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 4.5a10 10 0 0 1-18.8 4.2"/></svg></button>`;

            row.innerHTML = `
              <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <img src="${car.image}" alt="${car.name}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 0.5rem;">
                  <span style="font-weight: 600; color: var(--foreground);">${car.name}</span>
                </div>
              </td>
              <td style="color: var(--foreground);">${car.type}</td>
              <td style="color: var(--foreground);">₱${car.price.toLocaleString()}</td>
              <td><span class="text-destructive font-semibold">Archived</span></td>
              <td class="action-cell" style="display: flex; gap: 0.5rem;">
                <button class="btn-icon edit-vehicle-btn" data-id="${car.id}" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>`
                + actionButton +
              `
              </td>
            `;
            archivedTbody.appendChild(row);
          });
        }
    }

    // Attach the logout function to the logout button in the sidebar (if it exists).
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // --- Modal Handling for Adding/Editing Vehicles ---
    const modal = document.getElementById('fleet-modal');
    const addBtn = document.getElementById('add-vehicle-btn');
    const closeBtn = document.getElementById('close-fleet-modal');
    const form = document.getElementById('fleet-form');
    const searchInput = document.querySelector('.admin-search-input');

    searchInput?.addEventListener('input', event => {
      fleetSearchTerm = event.target.value;
      loadFleetData();
    });

    // Open the modal in "Add" mode when the "Add Vehicle" button is clicked.
    addBtn.onclick = function() {
      document.getElementById('modal-title').textContent = 'Add New Vehicle';
      form.reset();
      // Clear the hidden ID field to ensure it's a new entry.
      document.getElementById('vehicle-id').value = '';
      modal.style.display = "flex";
    }

    // Close the modal when the close button (x) is clicked.
    closeBtn.onclick = function() {
      modal.style.display = "none";
    }

    // Close the modal if the user clicks on the background overlay.
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

    // Use event delegation for edit/delete buttons
    // This allows a single event listener on the parent to handle clicks for dynamically added buttons.
    document.querySelector('.dashboard-content').addEventListener('click', function(e) {
      const editBtn = e.target.closest('.edit-vehicle-btn');
      if (editBtn) {
        const carId = editBtn.dataset.id;
        CARS = getFleet(); // Refresh data
        const car = CARS.find(c => c.id === carId);
        // If the car is found, populate the modal form with its data and show it.
        if (car) {
          document.getElementById('modal-title').textContent = 'Edit Vehicle';
          document.getElementById('vehicle-id').value = car.id;
          document.getElementById('vehicle-name').value = car.name;
          document.getElementById('vehicle-type').value = car.type;
          document.getElementById('vehicle-price').value = car.price;
          document.getElementById('vehicle-image').value = car.image;
          modal.style.display = 'flex';
        }
      }

      // Handle click on the "archive" button.
      const deleteBtn = e.target.closest('.delete-vehicle-btn');
      if (deleteBtn) {
        if (confirm('Are you sure you want to archive this vehicle? It will be hidden from users but can be recovered.')) {
          const carId = deleteBtn.dataset.id;
          let fleet = getFleet();
          const carIndex = fleet.findIndex(car => car.id === carId);
          // Set the vehicle's status to 'archived' (soft delete).
          if (carIndex > -1) {
            fleet[carIndex].status = 'archived';
            updateVehicleStatus(carId, 'archived');
          }
        }
      }

      // Handle click on the "recover" button.
      const recoverBtn = e.target.closest('.recover-vehicle-btn');
      if (recoverBtn) {
        const carId = recoverBtn.dataset.id;
        let fleet = getFleet();
        const carIndex = fleet.findIndex(car => car.id === carId);
        // Set the vehicle's status back to 'available'.
        if (carIndex > -1) {
          fleet[carIndex].status = 'available';
          updateVehicleStatus(carId, 'available');
        }
      }
    });

    // Handle form submission for adding/editing vehicles
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const carId = document.getElementById('vehicle-id').value;
      const carData = {
        name: document.getElementById('vehicle-name').value,
        type: document.getElementById('vehicle-type').value,
        price: parseInt(document.getElementById('vehicle-price').value, 10),
        image: document.getElementById('vehicle-image').value,
      };

      const existingCar = CARS.find(car => car.id === carId) || null;
      const vehicle = { ...(existingCar || {}), ...carData };
      const vehicleId = String(existingCar?.vehicle_id || carId || vehicle.id || Date.now());
      const payload = {
        vehicle_id: vehicleId,
        name: vehicle.name,
        type: vehicle.type,
        price: Number(vehicle.price || 0),
        image: vehicle.image,
        status: existingCar?.status || 'available',
        main_category: existingCar?.main_category || vehicle.type,
        transmission: existingCar?.transmission || 'Automatic',
        fuel: existingCar?.fuel || 'Gasoline',
        seats: Number(existingCar?.seats || 5),
        description: existingCar?.description || 'A great vehicle for your next journey.'
      };

      try {
        if (window.smartdriveSupabase) {
          const { error } = await window.smartdriveSupabase
            .from('vehicles')
            .upsert([payload], { onConflict: 'vehicle_id' });

          if (error) throw new Error(error.message || 'Could not save vehicle in Supabase.');
        } else {
          const response = await fetch('api/vehicles.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicle)
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.message || 'Could not save vehicle.');
        }

        modal.style.display = "none";
        await loadFleetData();
      } catch (error) {
        console.error('Could not save vehicle to database.', error);
        alert('The vehicle could not be saved to the database.');
      }
    });

    async function updateVehicleStatus(id, status) {
      try {
        if (window.smartdriveSupabase) {
          const { error } = await window.smartdriveSupabase
            .from('vehicles')
            .update({ status })
            .eq('vehicle_id', String(id));

          if (error) throw new Error(error.message || 'Could not update vehicle status.');
        } else {
          const response = await fetch('api/vehicles.php', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.message || 'Could not update vehicle status.');
        }
        await loadFleetData();
      } catch (error) {
        console.error('Could not update vehicle in database.', error);
        alert('The vehicle status could not be updated in the database.');
      }
    }

    // When the window loads, perform initial checks and load data.
    window.addEventListener('load', () => {
      checkAdmin();
      loadFleetData();
    });