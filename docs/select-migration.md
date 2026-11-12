# Migración a Select v0.6

Inventario de solo lectura del 11 de noviembre de 2026. Rutas relativas a `src/`
de cada checkout local; los números son líneas al levantar el inventario.
DRIs y Forward no se modificaron. Todos los campos encontrados son de selección
simple; las exportaciones de grupos de shadcn no tienen consumidores.

| App | Archivo y líneas | Campo actual (usos) | API de destino |
|---|---|---|---|
| DRIs | `components/admin/WorkspaceEditPanel.jsx`:68 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/calendar/CallOutPanel.jsx`:65, 77, 106 | Radix/shadcn (3) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/calendar/EventFormDialog.jsx`:81, 122, 136 | Radix/shadcn (3) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/ContributorsManager.jsx`:93, 109 | Radix/shadcn (2) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/DriEntityForm.jsx`:67 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/DriverUpdateModal.jsx`:144 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/InitiativeUpdateModal.jsx`:157, 171 | Radix/shadcn (2) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/ResultUpdateModal.jsx`:168, 182 | Radix/shadcn (2) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/UserSelect.jsx`:23 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/UserSelectWithInvite.jsx`:134 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/dri/ctg/CtgTracking.jsx`:119 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/inbox/PorResponder.jsx`:49, 57 | AgcsSelect (2) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/organization/InvitationFields.jsx`:27 | SearchSelect (1) | Conserva `id/name/value/onChange/required`; `description` pasa a `hint`. |
| DRIs | `components/organization/PersonPanel.jsx`:119, 135, 142 | SearchSelect (3) | Conserva `id/name/value/onChange/required`; `description` pasa a `hint`. |
| DRIs | `components/playbook/ArgusReview.jsx`:128 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/playbook/CreationJourney.jsx`:120 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/playbook/DriEditPanel.jsx`:147 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/playbook/DriField.jsx`:42 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/playbook/PropagationStep.jsx`:58, 59 | AgcsSelect (2) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/playbook/ShareContributionEditor.jsx`:140 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/projects/InitiativeProjects.jsx`:86 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/projects/ProjectBoard.jsx`:70, 72, 84 | AgcsSelect (3) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/propagation/PositionPanels.jsx`:65, 76, 89 | AgcsSelect (3) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/pulse/InitiativeUpdateCard.jsx`:147, 172 | Radix/shadcn (2) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/pulse/ResultUpdateCard.jsx`:137 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/strategic/IntentOverview.jsx`:214 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/strategic/IntentStep.jsx`:39 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/structure/NodeDeleteDialog.jsx`:139 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/system-users/OrgNodeAssignmentsPanel.jsx`:127, 167 | Radix/shadcn (2) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/system-users/PendingInvitesPanel.jsx`:224, 250, 471 | Radix/shadcn (3) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/system-users/PendingUsersPanel.jsx`:211, 232, 417 | Radix/shadcn (3) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/system-users/RemoveMemberDialog.jsx`:83 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/system-users/UsersTable.jsx`:188 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `components/tracking/PulseForm.jsx`:90, 94 | AgcsSelect (2) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/tracking/RoutineForm.jsx`:99, 109, 115 | AgcsSelect (3) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `components/tracking/RoutineMeeting.jsx`:87, 122, 243, 251 | AgcsSelect (4) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `ctg/CtgJoin.jsx`:506, 522 | CreatableCombobox (2) | Mapea `{id,name}` a `{value,label}`; adapta `onChange` a la entidad y usa `onCreate(text)` con opción temporal. |
| DRIs | `mockups/PlatformSkeletonMockup.jsx`:978, 1301, 1551, 2198, 2203, 2629, 2636, 2693, 2701, 2909, 2914, 3063, 3918, 5392 | Nativo (14) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| DRIs | `mockups/StrategicPropagationMockup.jsx`:208 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `pages/StrategicInsights.jsx`:61 | AgcsSelect (1) | Conserva `id/value/onChange/options/emptyLabel/aria-*`; elimina `darkMode`; ref a input. |
| DRIs | `pages/SystemStructure.jsx`:532 | Radix/shadcn (1) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| DRIs | `pages/SystemStructure.jsx`:666, 672, 678 | SearchSelect (3) | Conserva `id/name/value/onChange/required`; `description` pasa a `hint`. |
| Forward | `components/admin/users-manager.tsx`:201, 210, 217, 294, 303, 310 | Radix/shadcn (6) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| Forward | `components/app/person-assignment-field.tsx`:84 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/foresights/drivers-list.tsx`:66, 75 | Nativo (2) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/foresights/future-back-view.tsx`:599 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/foresights/present-forward-workspace.tsx`:1227, 1228 | Nativo (2) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/lab/as-is-editor.tsx`:250, 315 | Nativo (2) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/lab/blueprint-editor.tsx`:165, 177, 197 | NativeSelect (3) | Usa `Select` con `options/onChange(value)`; conserva los atributos que aporta `useFieldControl` en la app. |
| Forward | `components/lab/decision-panel.tsx`:662, 789 | Radix/shadcn (2) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| Forward | `components/lab/dvfr-editor.tsx`:115, 150, 160 | NativeSelect (3) | Usa `Select` con `options/onChange(value)`; conserva los atributos que aporta `useFieldControl` en la app. |
| Forward | `components/lab/experiment-trend.tsx`:61 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/lab/job-story-editor.tsx`:159, 175 | NativeSelect (2) | Usa `Select` con `options/onChange(value)`; conserva los atributos que aporta `useFieldControl` en la app. |
| Forward | `components/lab/native-select.tsx`:12 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/lab/options-editor.tsx`:104 | NativeSelect (1) | Usa `Select` con `options/onChange(value)`; conserva los atributos que aporta `useFieldControl` en la app. |
| Forward | `components/lab/piece-guide.tsx`:419, 438 | NativeSelect (2) | Usa `Select` con `options/onChange(value)`; conserva los atributos que aporta `useFieldControl` en la app. |
| Forward | `components/lab/prototipo-stage.tsx`:588, 675, 696 | Radix/shadcn (3) | Aplana `SelectItem` a `options`; `onValueChange` pasa a `onChange`; conserva `name/defaultValue/required/disabled`. |
| Forward | `components/portfolio/explore-portfolio-home.tsx`:1775, 1789, 1891 | Nativo (3) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/portfolio/strategic-responses-mock.tsx`:528 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `components/portfolio/strategic-responses.tsx`:400 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `features/acceleration.tsx`:515 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `features/framing.tsx`:247 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |
| Forward | `features/job-stories.tsx`:97 | Nativo (1) | Convierte `<option>` a `options`; `event.target.value` pasa al primer argumento de `onChange`; vacío a `emptyLabel`. |

## Adaptaciones que conserva la app

- `AgcsSelect`: devuelve strings, incluido `""` al limpiar. Los refs que usaban
  `HTMLButtonElement` pasan a `HTMLInputElement`; `.focus()` sigue disponible.
  Elimina `darkMode`: usa los roles heredados del contenedor oscuro.
- `UserSelect` convierte el sentinel `"null"` a `emptyLabel`; CTG convierte
  `""` a `null`. Los estados de creación `{id:null,name}` necesitan una opción
  temporal con valor propio hasta que se guarde la entidad.
- `UserSelectWithInvite` conserva fuera del campo su acción de invitar y la
  carga de usuarios. No coloques acciones ni formularios dentro del listbox.
- `explore-portfolio-home.tsx` conserva el efecto de `__create_market__` como
  opción con ese valor, o conecta `onCreate(text)` al flujo de alta del mercado.
- `NativeSelect` aporta contexto de `Field`; el wrapper de la app debe pasar
  `id`, `aria-describedby` y `aria-invalid` a Select, o hacerlo en cada uso.
- `OrgCombo.jsx` no existe en el checkout de DRIs y no se encontraron referencias
  a `OrgCombo`. `freeText` cubre el contrato solicitado: texto arbitrario,
  `onChange(text, null)` por edición y sugerencias elegibles.
- No se incluyen grupos, selección múltiple, renderizado arbitrario de opciones,
  carga remota ni invitaciones: el inventario no exige los tres primeros; la
  app conserva sus consultas, acciones y efectos de negocio.

La cabecera de copia, el comportamiento, el fallback y la configuración del
checker están en la sección Select del README. La verificación de capa superior
y geometría de la suite usa jsdom con Popover API simulado; la comprobación
visual con un diálogo real sigue siendo parte de la revisión en navegador.
