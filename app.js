const { useState, useEffect, useMemo } = React;

        const initialData = {
            clientes: [
                { id: 1, nombre: "Juan Pérez", objetivo: "Hipertrofia", peso: 85, altura: 180, lesiones: "Molestia leve en hombro derecho", cargas: [], rutinas: [] },
                { id: 2, nombre: "Ana García", objetivo: "Pérdida de Grasa", peso: 64, altura: 165, lesiones: "Ninguna", cargas: [], rutinas: [] }
            ],
            clases: [
                { id: 101, nombre: "Crossfit Mañana", rutinas: [] },
            ],
            recordatorios: []
        };

        const formatFecha = (str) => {
            if(!str) return '';
            const [y, m, d] = str.split('-');
            return `${d}-${m}-${y}`;
        };

        const truncar = (txt, limite = 30) => {
            if (!txt) return "";
            return txt.length > limite ? txt.substring(0, limite) + "..." : txt;
        };

        const RenderSpecs = ({ e, gen }) => {
            const displayS = e.s || (gen ? gen.split('x')[0] : '');
            const displayR = e.r || (gen ? gen.split('x')[1] : '');
            if (e.t) return <span className="font-bold text-slate-700">{e.t} seg</span>;
            if (displayS && displayR) return <span className="font-bold text-slate-700">{displayS}x{displayR}</span>;
            return null;
        };

        const App = () => {
            const [data, setData] = useState(() => {
                const saved = localStorage.getItem('gymData_matias');
                return saved ? JSON.parse(saved) : initialData;
            });
            const [vista, setVista] = useState('inicio');
            const [seleccionado, setSeleccionado] = useState(null);
            const [modal, setModal] = useState({ abierto: false, tipo: '', editando: null });
            const [temaOscuro, setTemaOscuro] = useState(() => {
                const saved = localStorage.getItem('tema_oscuro');
                return saved ? JSON.parse(saved) : false;
            });
            const [nombreUsuario, setNombreUsuario] = useState(() => {
                const saved = localStorage.getItem('nombreUsuario_matias');
                return saved ? JSON.parse(saved) : '';
            });
            const [mostrarRegistro, setMostrarRegistro] = useState(!nombreUsuario);

            useEffect(() => { localStorage.setItem('gymData_matias', JSON.stringify(data)); }, [data]);
            
            useEffect(() => {
                localStorage.setItem('tema_oscuro', JSON.stringify(temaOscuro));
                if (temaOscuro) {
                    document.documentElement.classList.add('dark-mode');
                } else {
                    document.documentElement.classList.remove('dark-mode');
                }
            }, [temaOscuro]);

            const guardarNombre = (nombre) => {
                setNombreUsuario(nombre);
                localStorage.setItem('nombreUsuario_matias', JSON.stringify(nombre));
                setMostrarRegistro(false);
            };

            const guardarEntidad = (tipo, entidad) => {
                const newData = { ...data };
                if (entidad.id) newData[tipo] = newData[tipo].map(item => item.id === entidad.id ? entidad : item);
                else { entidad.id = Date.now(); newData[tipo].push(entidad); }
                setData(newData);
                if (seleccionado && seleccionado.id === entidad.id) setSeleccionado(entidad);
            };

            const compartirWhatsApp = (rutina, esClase = false) => {
                let texto = `RUTINA: ${rutina.nombre.toUpperCase()}\n`;
                if(esClase) texto += `Fecha Clase: ${formatFecha(rutina.fechaClase)}\n`;
                const exportarBloque = (titulo, ejercicios, general) => {
                    if(!ejercicios || ejercicios.length === 0) return "";
                    let b = `\n${titulo} [${general || ''}]\n`;
                    ejercicios.forEach(e => {
                        const s = e.s || (general ? general.split('x')[0] : '');
                        const r = e.r || (general ? general.split('x')[1] : '');
                        let spec = e.t ? `${e.t} seg` : (s && r ? `${s}x${r}` : '');
                        b += `- ${e.ej} ${spec}\n`;
                        if(e.inst) b += `  (Nota: ${e.inst})\n`;
                    });
                    return b;
                };
                if(rutina.dias) {
                    rutina.dias.forEach(dia => {
                        texto += `\n--- ${dia.nombre.toUpperCase()} ---`;
                        texto += exportarBloque('ENTRADA EN CALOR', dia.entrada, dia.genEntrada);
                        texto += exportarBloque('RUTINA PRINCIPAL', dia.principal, dia.genPrincipal);
                    });
                } else {
                    texto += exportarBloque('ENTRADA EN CALOR', rutina.entrada, rutina.generalEntrada);
                    texto += exportarBloque('RUTINA PRINCIPAL', rutina.principal, rutina.generalPrincipal);
                }
                window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
            };

            return (
                <div className="flex h-screen overflow-hidden flex-col md:flex-row">
                    <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-b md:border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-lg">
                        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 font-black text-blue-600 dark:text-blue-400 tracking-tighter cursor-pointer flex justify-between items-center" onClick={() => setVista('inicio')}>
                            <span className="text-lg md:text-base">GYM ADMIN PRO</span>
                            <button onClick={(e) => { e.stopPropagation(); setTemaOscuro(!temaOscuro); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Cambiar tema">
                                {temaOscuro ? '☀️' : '🌙'}
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1 text-xs md:text-sm">
                            <button onClick={() => setVista('inicio')} className={`w-full text-left p-2 rounded-lg font-semibold truncate ${vista === 'inicio' ? 'active-view' : ''}`}>Dashboard Inicio</button>
                            <div className="pt-4 pb-2 text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Clientes</div>
                            {data.clientes.map(c => (
                                <button key={c.id} onClick={() => { setSeleccionado(c); setVista('cliente'); }} className={`w-full text-left p-2 rounded-lg truncate ${seleccionado?.id === c.id && vista === 'cliente' ? 'active-view' : ''}`}>{c.nombre}</button>
                            ))}
                            <button onClick={() => setModal({abierto: true, tipo: 'cliente', editando: null})} className="w-full text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold p-2 text-left">+ Nuevo Cliente</button>
                            <div className="pt-4 pb-2 text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Clases</div>
                            {data.clases.map(c => (
                                <button key={c.id} onClick={() => { setSeleccionado(c); setVista('clase'); }} className={`w-full text-left p-2 rounded-lg truncate ${seleccionado?.id === c.id && vista === 'clase' ? 'active-view' : ''}`}>{c.nombre}</button>
                            ))}
                            <button onClick={() => setModal({abierto: true, tipo: 'clase'})} className="w-full text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-bold p-2 text-left">+ Nueva Clase</button>
                            <button onClick={() => setVista('calendario')} className={`w-full text-left p-2 rounded-lg font-semibold mt-4 ${vista === 'calendario' ? 'active-view' : ''}`}>Calendario Completo</button>
                        </nav>
                    </aside>

                    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                        {vista === 'inicio' && <VistaInicio nombreUsuario={nombreUsuario} data={data} setVista={setVista} setSeleccionado={setSeleccionado} setModal={setModal} />}
                        {vista === 'cliente' && seleccionado && (
                            <VistaCliente 
                                cliente={seleccionado} 
                                onEditarFicha={() => setModal({abierto: true, tipo: 'cliente', editando: seleccionado})}
                                onNuevaRutina={() => setModal({abierto: true, tipo: 'rutinaCliente'})}
                                onEditarRutina={(r) => setModal({abierto: true, tipo: 'rutinaCliente', editando: r})}
                                onCompartir={(r) => compartirWhatsApp(r)}
                                onUpdateCargas={(cargas) => guardarEntidad('clientes', {...seleccionado, cargas})}
                            />
                        )}
                        {vista === 'clase' && seleccionado && (
                            <VistaClase 
                                clase={seleccionado} 
                                onNuevaRutina={() => setModal({abierto: true, tipo: 'rutinaClase'})}
                                onEditar={(r) => setModal({abierto: true, tipo: 'rutinaClase', editando: r})}
                                onCompartir={(r) => compartirWhatsApp(r, true)}
                            />
                        )}
                        {vista === 'calendario' && <VistaCalendario recordatorios={data.recordatorios} clientes={data.clientes} onNuevo={() => setModal({abierto: true, tipo: 'recordatorio'})} />}
                    </main>

                    {mostrarRegistro && (
                        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 text-slate-800 dark:text-slate-100">
                                <FormRegistro onGuardar={guardarNombre} />
                            </div>
                        </div>
                    )}

                    {modal.abierto && (
                        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 text-slate-800 dark:text-slate-100">
                                {modal.tipo === 'cliente' && <FormCliente editando={modal.editando} onCerrar={() => setModal({abierto: false})} onGuardar={(c) => guardarEntidad('clientes', c)} />}
                                {modal.tipo === 'clase' && <FormClase onCerrar={() => setModal({abierto: false})} onGuardar={(c) => guardarEntidad('clases', c)} />}
                                {modal.tipo === 'rutinaClase' && <FormRutinaClase editando={modal.editando} onCerrar={() => setModal({abierto: false})} onGuardar={(r) => {
                                    const actual = {...seleccionado};
                                    if(r.id) actual.rutinas = actual.rutinas.map(item => item.id === r.id ? r : item);
                                    else { r.id = Date.now(); r.fechaCreacion = new Date().toISOString().split('T')[0]; actual.rutinas.push(r); }
                                    guardarEntidad('clases', actual);
                                }} />}
                                {modal.tipo === 'rutinaCliente' && <FormRutinaCliente editando={modal.editando} onCerrar={() => setModal({abierto: false})} onGuardar={(r) => {
                                    const actual = {...seleccionado};
                                    if(!actual.rutinas) actual.rutinas = [];
                                    if(r.id) actual.rutinas = actual.rutinas.map(item => item.id === r.id ? r : item);
                                    else { r.id = Date.now(); actual.rutinas.push(r); }
                                    guardarEntidad('clientes', actual);
                                }} />}
                                {modal.tipo === 'recordatorio' && <FormRecordatorio clientes={data.clientes} onCerrar={() => setModal({abierto: false})} onGuardar={(rec) => guardarEntidad('recordatorios', rec)} />}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const VistaInicio = ({ nombreUsuario, data, setVista, setSeleccionado, setModal }) => {
            const proximos = useMemo(() => {
                return [...data.recordatorios]
                    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                    .slice(0, 5);
            }, [data.recordatorios]);
            return (
                <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
                    <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 text-slate-800 dark:text-slate-100">Hola, {nombreUsuario}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
                        <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg">
                            <p className="text-blue-100 font-bold text-[10px] md:text-xs uppercase tracking-widest">Clientes Activos</p>
                            <p className="text-3xl md:text-5xl font-black mt-2">{data.clientes.length}</p>
                        </div>
                        <div className="bg-indigo-600 dark:bg-indigo-700 text-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg">
                            <p className="text-indigo-100 font-bold text-[10px] md:text-xs uppercase tracking-widest">Clases Grupales</p>
                            <p className="text-3xl md:text-5xl font-black mt-2">{data.clases.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest">Tareas Pendientes</p>
                            <p className="text-3xl md:text-5xl font-black mt-2 text-slate-800 dark:text-slate-100">{data.recordatorios.length}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4 md:mb-6 flex-wrap gap-2">
                                <h3 className="text-lg md:text-xl font-black dark:text-slate-100">Próximos en Calendario</h3>
                                <button onClick={() => setVista('calendario')} className="text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold">Ver todo</button>
                            </div>
                            <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
                                {proximos.length > 0 ? proximos.map(rec => (
                                    <div key={rec.id} className="flex items-center gap-3 p-3 md:p-4 bg-slate-50 dark:bg-slate-700 rounded-xl md:rounded-2xl">
                                        <div className="bg-white dark:bg-slate-600 p-2 rounded-lg text-center min-w-[50px] md:min-w-[60px] border border-slate-200 dark:border-slate-500 shadow-sm">
                                            <p className="text-[8px] md:text-[10px] font-black text-blue-600 dark:text-blue-400">{formatFecha(rec.fecha).split('-')[1]}</p>
                                            <p className="text-sm md:text-lg font-black dark:text-slate-100">{formatFecha(rec.fecha).split('-')[0]}</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 dark:text-slate-100 truncate text-sm">{data.clientes.find(c => c.id == rec.clienteId)?.nombre || 'General'}</p>
                                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tighter">{rec.tipo}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-slate-400 dark:text-slate-500 text-sm italic">No hay tareas agendadas...</p>}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 dark:text-slate-100">Accesos Rápidos</h3>
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <button onClick={() => setModal({abierto: true, tipo: 'recordatorio'})} className="p-3 md:p-4 bg-slate-800 dark:bg-slate-700 text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">Agendar Tarea</button>
                                <button onClick={() => setModal({abierto: true, tipo: 'cliente', editando: null})} className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm border border-blue-100 dark:border-blue-800">Nuevo Cliente</button>
                                <button onClick={() => setModal({abierto: true, tipo: 'clase'})} className="p-3 md:p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm border border-indigo-100 dark:border-indigo-800">Nueva Clase</button>
                                <button onClick={() => setVista('calendario')} className="p-3 md:p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm border border-orange-100 dark:border-orange-800">Calendario</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const VistaCliente = ({ cliente, onEditarFicha, onNuevaRutina, onEditarRutina, onCompartir, onUpdateCargas }) => {
            const [nuevoPeso, setNuevoPeso] = useState({ ej: '', peso: '', fecha: new Date().toISOString().split('T')[0] });
            const cargasAgrupadas = (cliente.cargas || []).reduce((acc, curr) => {
                const nombreKey = curr.ej.trim().toLowerCase();
                if (!acc[nombreKey]) acc[nombreKey] = { nombre: curr.ej, registros: [] };
                acc[nombreKey].registros.push(curr);
                return acc;
            }, {});

            return (
                <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 md:mb-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100">{cliente.nombre}</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight text-sm">Ficha Técnica Completa</p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            <button onClick={onEditarFicha} className="bg-white dark:bg-slate-700 border dark:border-slate-600 text-slate-600 dark:text-slate-300 px-4 md:px-6 py-2 rounded-lg md:rounded-xl font-bold shadow-sm text-sm md:text-base">Editar Ficha</button>
                            <button onClick={onNuevaRutina} className="bg-blue-600 dark:bg-blue-700 text-white px-4 md:px-6 py-2 rounded-lg md:rounded-xl font-bold shadow-lg text-sm md:text-base">+ Crear Rutina</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 md:mb-4 text-sm md:text-base">Evolución de Cargas</h3>
                            <div className="space-y-3 mb-4 md:mb-6 max-h-48 overflow-y-auto pr-2">
                                {Object.values(cargasAgrupadas).map((grupo, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg md:rounded-xl">
                                        <p className="text-[10px] md:text-xs font-black text-blue-600 dark:text-blue-400 uppercase mb-2">{grupo.nombre}</p>
                                        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1 hide-scrollbar">
                                            {grupo.registros.map((r, i) => (
                                                <div key={i} className="bg-white dark:bg-slate-600 border dark:border-slate-500 rounded-lg px-2 md:px-3 py-1 text-center min-w-[60px] md:min-w-[70px]">
                                                    <div className="text-xs md:text-sm font-black dark:text-slate-100">{r.peso}kg</div>
                                                    <div className="text-[8px] text-slate-400 dark:text-slate-400">{formatFecha(r.fecha)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <input className="flex-1 min-w-[100px] p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-xs md:text-sm" placeholder="Ejercicio" value={nuevoPeso.ej} onChange={e=>setNuevoPeso({...nuevoPeso, ej: e.target.value})} />
                                <input className="w-14 md:w-16 p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-xs md:text-sm" placeholder="Kg" type="number" value={nuevoPeso.peso} onChange={e=>setNuevoPeso({...nuevoPeso, peso: e.target.value})} />
                                <input className="w-24 md:w-32 p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg text-[10px] md:text-xs" type="date" value={nuevoPeso.fecha} onChange={e=>setNuevoPeso({...nuevoPeso, fecha: e.target.value})} />
                                <button onClick={() => { if(nuevoPeso.ej && nuevoPeso.peso) { onUpdateCargas([...(cliente.cargas||[]), nuevoPeso]); setNuevoPeso({...nuevoPeso, ej:'', peso:'', fecha: new Date().toISOString().split('T')[0]}); }}} className="bg-slate-800 dark:bg-slate-600 text-white px-2 md:px-3 rounded-lg text-[10px] md:text-xs font-bold hover:bg-slate-700 dark:hover:bg-slate-500">OK</button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-xs md:text-sm">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 md:mb-4">Datos del Cliente</h3>
                            <div className="grid grid-cols-2 gap-2 md:gap-4">
                                <div className="p-2 md:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"><strong>Objetivo:</strong><br/><span className="text-xs">{cliente.objetivo}</span></div>
                                <div className="p-2 md:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"><strong>Físico:</strong><br/><span className="text-xs">{cliente.peso}kg / {cliente.altura}cm</span></div>
                                <div className="p-2 md:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg col-span-2"><strong>Lesiones / Obs:</strong><br/><span className="text-xs">{cliente.lesiones || 'Ninguna'}</span></div>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-lg md:text-xl">Historial de Rutinas</h3>
                    <div className="space-y-4 md:space-y-6">
                        {cliente.rutinas?.map(r => (
                            <div key={r.id} className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-4">
                                    <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">{r.nombre}</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => onCompartir(r)} className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-lg text-xs font-bold border border-green-100 dark:border-green-800">WhatsApp</button>
                                        <button onClick={() => onEditarRutina(r)} className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800">Editar</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                    {r.dias.map((dia, dIdx) => (
                                        <div key={dIdx} className="bg-slate-50 dark:bg-slate-700 p-3 md:p-4 rounded-xl md:rounded-2xl text-xs">
                                            <p className="font-black text-blue-600 dark:text-blue-400 mb-2 border-b border-slate-200 dark:border-slate-600 pb-1 uppercase">{dia.nombre}</p>
                                            {dia.principal?.map((e, ei) => (
                                                <div key={ei} className="py-2 border-b border-white dark:border-slate-600 last:border-0 overflow-hidden">
                                                    <div className="flex justify-between">
                                                        <span className="font-bold truncate pr-2 dark:text-slate-100">{e.ej}</span>
                                                        <RenderSpecs e={e} gen={dia.genPrincipal} />
                                                    </div>
                                                    {e.inst && (
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 truncate" title={e.inst}>
                                                            {truncar(e.inst, 30)}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        const VistaClase = ({ clase, onNuevaRutina, onCompartir, onEditar }) => (
            <div className="p-8 max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div><h2 className="text-4xl font-black">{clase.nombre}</h2><p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Planificación Grupal</p></div>
                    <button onClick={onNuevaRutina} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg">+ Nueva Clase</button>
                </div>
                <div className="space-y-12">
                    {clase.rutinas?.sort((a,b)=>new Date(b.fechaClase)-new Date(a.fechaClase)).map(r => (
                        <div key={r.id} className="bg-white rounded-[2rem] border p-8 shadow-sm">
                            <div className="flex justify-between items-start mb-6">
                                <div><h3 className="text-3xl font-black">{r.nombre}</h3><p className="text-blue-600 font-bold">Fecha: {formatFecha(r.fechaClase)}</p></div>
                                <div className="text-right">
                                    <button onClick={() => onCompartir(r)} className="bg-green-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md mb-2">WhatsApp</button>
                                    <button onClick={() => onEditar(r)} className="block w-full text-xs text-blue-500 font-bold">Editar</button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                                    <p className="text-orange-700 font-black text-sm mb-4 uppercase">Entrada en Calor</p>
                                    {r.entrada.map((e, i) => (
                                        <div key={i} className="border-b border-orange-100/50 py-2 text-sm last:border-0">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{e.ej}</span> <RenderSpecs e={e} gen={r.generalEntrada} />
                                            </div>
                                            {e.inst && <p className="text-[11px] text-orange-600 italic mt-0.5 truncate" title={e.inst}>{truncar(e.inst, 30)}</p>}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                                    <p className="text-blue-700 font-black text-sm mb-4 uppercase">Rutina Principal</p>
                                    {r.principal.map((e, i) => (
                                        <div key={i} className="border-b border-blue-100/50 py-2 text-sm last:border-0">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{e.ej}</span> <RenderSpecs e={e} gen={r.generalPrincipal} />
                                            </div>
                                            {e.inst && <p className="text-[11px] text-blue-600 italic mt-0.5 truncate" title={e.inst}>{truncar(e.inst, 30)}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

        const VistaCalendario = ({ recordatorios, clientes, onNuevo }) => (
            <div className="p-8 max-w-5xl mx-auto text-slate-800">
                <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black">Calendario</h2><button onClick={onNuevo} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold">+ Agendar</button></div>
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase"><tr><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Tarea</th><th className="p-4">Estado</th></tr></thead>
                        <tbody className="divide-y text-sm font-medium">
                            {recordatorios.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50">
                                    <td className="p-4">{formatFecha(rec.fecha)}</td>
                                    <td className="p-4 font-black">{clientes.find(c => c.id == rec.clienteId)?.nombre}</td>
                                    <td className="p-4">{rec.tipo}</td>
                                    <td className="p-4"><span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Pendiente</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );

        // --- FORMULARIOS ---

        const FormRegistro = ({ onGuardar }) => {
            const [nombre, setNombre] = useState('');
            return (
                <div className="space-y-6 text-center">
                    <div>
                        <h2 className="text-3xl font-black mb-2">Bienvenido! 👋</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">¿Cuál es tu nombre?</p>
                    </div>
                    <input className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100 font-bold text-lg placeholder-slate-400" placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} autoFocus />
                    <button onClick={()=>{ if(nombre.trim()) onGuardar(nombre.trim()); }} disabled={!nombre.trim()} className="w-full bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Continuar</button>
                </div>
            );
        };

        const FormCliente = ({ editando, onCerrar, onGuardar }) => {
            const [f, setF] = useState(editando || { nombre: '', objetivo: '', peso: '', altura: '', lesiones: '', rutinas: [], cargas: [] });
            return (
                <div className="space-y-6">
                    <h2 className="text-3xl font-black dark:text-slate-100">{editando ? 'Editar Ficha Cliente' : 'Nueva Ficha Cliente'}</h2>
                    <input className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100" placeholder="Nombre completo" value={f.nombre} onChange={e=>setF({...f, nombre: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100" placeholder="Peso (kg)" type="number" value={f.peso} onChange={e=>setF({...f, peso: e.target.value})} />
                        <input className="p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100" placeholder="Altura (cm)" type="number" value={f.altura} onChange={e=>setF({...f, altura: e.target.value})} />
                    </div>
                    <input className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100" placeholder="Objetivo" value={f.objetivo} onChange={e=>setF({...f, objetivo: e.target.value})} />
                    <textarea className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100 h-32" placeholder="Lesiones, molestias u observaciones..." value={f.lesiones} onChange={e=>setF({...f, lesiones: e.target.value})} />
                    <div className="flex justify-end gap-3"><button onClick={onCerrar} className="px-6 py-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancelar</button><button onClick={()=>{onGuardar(f); onCerrar();}} className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600">Guardar Cambios</button></div>
                </div>
            );
        };

        const FormClase = ({ onCerrar, onGuardar }) => {
            const [nombre, setNombre] = useState('');
            return (
                <div className="space-y-6">
                    <h2 className="text-3xl font-black dark:text-slate-100">Nueva Clase Grupal</h2>
                    <input className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100 font-bold" placeholder="Nombre de la clase" value={nombre} onChange={e=>setNombre(e.target.value)} />
                    <div className="flex justify-end gap-3"><button onClick={onCerrar} className="px-6 py-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancelar</button><button onClick={()=>{onGuardar({nombre, rutinas: []}); onCerrar();}} className="bg-indigo-600 dark:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600">Crear Clase</button></div>
                </div>
            );
        };

        const FormRutinaCliente = ({ editando, onCerrar, onGuardar }) => {
            const [form, setForm] = useState(editando || { nombre: '', tipoSeccion: 'Ambas', diasCount: 1, dias: [{ nombre: 'Día 1', genEntrada: '', genPrincipal: '', entrada: [], principal: [] }] });
            const adjustDias = (count) => {
                let d = [...form.dias];
                if(count > d.length) for(let i=d.length; i<count; i++) d.push({ nombre: `Día ${i+1}`, genEntrada: '', genPrincipal: '', entrada: [], principal: [] });
                else d = d.slice(0, count);
                setForm({...form, diasCount: count, dias: d});
            };
            const updateEj = (dIdx, type, eIdx, field, val) => {
                const n = [...form.dias]; n[dIdx][type][eIdx][field] = val; setForm({...form, dias: n});
            };
            return (
                <div className="space-y-8">
                    <div className="flex justify-between items-center"><h2 className="text-3xl font-black dark:text-slate-100">Planificar Rutina</h2>
                        <div className="flex gap-4">
                            <select className="p-3 border border-slate-300 dark:border-slate-600 rounded-2xl font-bold bg-white dark:bg-slate-700 dark:text-slate-100 text-sm" value={form.tipoSeccion} onChange={e=>setForm({...form, tipoSeccion: e.target.value})}><option value="Ambas">E. Calor + Rutina</option><option value="Solo Entrada">Solo Entrada</option><option value="Solo Rutina">Solo Rutina</option></select>
                            <select className="p-3 border border-slate-300 dark:border-slate-600 rounded-2xl font-bold bg-white dark:bg-slate-700 dark:text-slate-100 text-sm" value={form.diasCount} onChange={e=>adjustDias(parseInt(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Días</option>)}</select>
                        </div>
                    </div>
                    <input className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100 font-bold" placeholder="Nombre de la Rutina" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
                    {form.dias.map((dia, dIdx) => (
                        <div key={dIdx} className="p-6 border-2 border-slate-300 dark:border-slate-600 rounded-3xl bg-slate-50 dark:bg-slate-700">
                            <input className="text-lg font-black mb-4 bg-transparent border-b border-slate-300 dark:border-slate-500 dark:text-slate-100" value={dia.nombre} onChange={e=>{const n=[...form.dias]; n[dIdx].nombre=e.target.value; setForm({...form, dias:n});}} />
                            <div className="grid md:grid-cols-2 gap-6">
                                {(form.tipoSeccion === 'Ambas' || form.tipoSeccion === 'Solo Entrada') && (
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500">
                                        <div className="flex justify-between items-center mb-3 text-[10px] font-black uppercase text-orange-500 dark:text-orange-400">Entrada en Calor</div>
                                        {dia.entrada.map((ej, eIdx) => (
                                            <div key={eIdx} className="flex gap-1 mb-1 items-center">
                                                <input className="flex-1 p-1.5 border border-slate-300 dark:border-slate-500 rounded text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="Ej" value={ej.ej} onChange={e=>updateEj(dIdx, 'entrada', eIdx, 'ej', e.target.value)} />
                                                <input className="w-16 p-1.5 border border-slate-300 dark:border-slate-500 rounded text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="S x R" value={ej.s} onChange={e=>updateEj(dIdx, 'entrada', eIdx, 's', e.target.value)} />
                                                <input className="w-24 p-1.5 border border-slate-300 dark:border-slate-500 rounded text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="Instrucciones" value={ej.inst} onChange={e=>updateEj(dIdx, 'entrada', eIdx, 'inst', e.target.value)} />
                                                <button onClick={()=>{const n=[...form.dias]; n[dIdx].entrada=n[dIdx].entrada.filter((_, idx)=>idx!==eIdx); setForm({...form, dias:n});}} className="text-red-400 dark:text-red-500 font-bold px-1">×</button>
                                            </div>
                                        ))}
                                        <button onClick={()=>{const n=[...form.dias]; n[dIdx].entrada.push({ej:'', s:'', r:'', t:'', inst:''}); setForm({...form, dias:n});}} className="text-[10px] font-black opacity-40 dark:opacity-60 mt-2 dark:text-slate-300">+ AGREGAR</button>
                                    </div>
                                )}
                                {(form.tipoSeccion === 'Ambas' || form.tipoSeccion === 'Solo Rutina') && (
                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500">
                                        <div className="flex justify-between items-center mb-3 text-[10px] font-black uppercase text-blue-500 dark:text-blue-400">Principal</div>
                                        {dia.principal.map((ej, eIdx) => (
                                            <div key={eIdx} className="flex gap-1 mb-1 items-center">
                                                <input className="flex-1 p-1.5 border border-slate-300 dark:border-slate-500 rounded text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="Ej" value={ej.ej} onChange={e=>updateEj(dIdx, 'principal', eIdx, 'ej', e.target.value)} />
                                                <input className="w-16 p-1.5 border border-slate-300 dark:border-slate-500 rounded text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="S x R" value={ej.s} onChange={e=>updateEj(dIdx, 'principal', eIdx, 's', e.target.value)} />
                                                <input className="w-24 p-1.5 border border-slate-300 dark:border-slate-500 rounded text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="Instrucciones" value={ej.inst} onChange={e=>updateEj(dIdx, 'principal', eIdx, 'inst', e.target.value)} />
                                                <button onClick={()=>{const n=[...form.dias]; n[dIdx].principal=n[dIdx].principal.filter((_, idx)=>idx!==eIdx); setForm({...form, dias:n});}} className="text-red-400 dark:text-red-500 font-bold px-1">×</button>
                                            </div>
                                        ))}
                                        <button onClick={()=>{const n=[...form.dias]; n[dIdx].principal.push({ej:'', s:'', r:'', t:'', inst:''}); setForm({...form, dias:n});}} className="text-[10px] font-black opacity-40 dark:opacity-60 mt-2 dark:text-slate-300">+ AGREGAR</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-300 dark:border-slate-600 sticky bottom-0 bg-white dark:bg-slate-800"><button onClick={onCerrar} className="px-6 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancelar</button><button onClick={()=>{onGuardar({...form, fecha: new Date().toISOString().split('T')[0]}); onCerrar();}} className="bg-blue-600 dark:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600">Guardar Planificación</button></div>
                </div>
            );
        };

        const FormRutinaClase = ({ editando, onCerrar, onGuardar }) => {
            const [form, setForm] = useState(editando || { nombre: '', fechaClase: new Date().toISOString().split('T')[0], generalEntrada: '', generalPrincipal: '', entrada: [{ej: '', s: '', r: '', t: '', inst: ''}], principal: [{ej: '', s: '', r: '', t: '', inst: ''}] });
            const updateRow = (type, i, field, val) => { const newRows = [...form[type]]; newRows[i][field] = val; setForm({...form, [type]: newRows}); };
            return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h2 className="text-2xl font-black dark:text-slate-100">Planificar Clase</h2><input type="date" className="p-2 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-slate-100" value={form.fechaClase} onChange={e=>setForm({...form, fechaClase: e.target.value})} /></div>
                    <input className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-700 dark:text-slate-100 font-bold" placeholder="Título" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
                    <div className="grid md:grid-cols-1 gap-6">
                        {['entrada', 'principal'].map(type => (
                            <div key={type} className={`p-6 rounded-3xl border ${type==='entrada'?'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800':'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                                <h3 className="font-black uppercase text-xs mb-4 dark:text-slate-100">{type==='entrada'?'Entrada en Calor':'Principal'}</h3>
                                {form[type].map((r, i) => (
                                    <div key={i} className="flex gap-1 mb-2 items-center">
                                        <input className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="Ej" value={r.ej} onChange={e=>updateRow(type, i, 'ej', e.target.value)} />
                                        <input className="w-16 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="S x R" value={r.s} onChange={e=>updateRow(type, i, 's', e.target.value)} />
                                        <input className="w-48 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[10px] dark:bg-slate-700 dark:text-slate-100" placeholder="Instrucciones/Descripción" value={r.inst} onChange={e=>updateRow(type, i, 'inst', e.target.value)} />
                                        <button onClick={()=>setForm({...form, [type]: form[type].filter((_, idx) => idx !== i)})} className="text-red-400 dark:text-red-500 font-bold px-1">×</button>
                                    </div>
                                ))}
                                <button onClick={()=>setForm({...form, [type]: [...form[type], {ej:'',s:'',r:'',t:'', inst:''}]})} className="text-[10px] font-black opacity-60 dark:text-slate-300">+ AGREGAR</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-4"><button onClick={onCerrar} className="px-6 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancelar</button><button onClick={()=>{onGuardar(form); onCerrar();}} className="bg-slate-800 dark:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-700 dark:hover:bg-slate-600">Guardar Plan</button></div>
                </div>
            );
        };

        const FormRecordatorio = ({ clientes, onCerrar, onGuardar }) => {
            const [form, setForm] = useState({ clienteId: '', fecha: new Date().toISOString().split('T')[0], tipo: 'Actualizar rutina', detalle: '' });
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black dark:text-slate-100">Agendar Tarea</h2>
                    <select className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-100" value={form.clienteId} onChange={e=>setForm({...form, clienteId: e.target.value})}><option value="">¿Para quién?</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                    <input type="date" className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-100" value={form.fecha} onChange={e=>setForm({...form, fecha: e.target.value})} />
                    <textarea className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-slate-100" placeholder="Anotaciones..." onChange={e=>setForm({...form, detalle: e.target.value})} />
                    <div className="flex justify-end gap-3"><button onClick={onCerrar} className="px-6 py-2 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cerrar</button><button onClick={()=>{onGuardar(form); onCerrar();}} className="bg-blue-600 dark:bg-blue-700 text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-700 dark:hover:bg-blue-600">Agendar</button></div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
