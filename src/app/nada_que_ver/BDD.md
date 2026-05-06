| table_name         | column_name            | data_type                |
| ------------------ | ---------------------- | ------------------------ |
| activos_fijos      | id                     | uuid                     |
| activos_fijos      | empresa_id             | uuid                     |
| activos_fijos      | codigo                 | character varying        |
| activos_fijos      | descripcion            | character varying        |
| activos_fijos      | categoria              | USER-DEFINED             |
| activos_fijos      | fecha_adquisicion      | date                     |
| activos_fijos      | costo_historico        | numeric                  |
| activos_fijos      | valor_residual         | numeric                  |
| activos_fijos      | vida_util_anios        | smallint                 |
| activos_fijos      | metodo_depreciacion    | USER-DEFINED             |
| activos_fijos      | tasa_depreciacion      | numeric                  |
| activos_fijos      | valor_libros_actual    | numeric                  |
| activos_fijos      | depreciacion_acumulada | numeric                  |
| activos_fijos      | cuenta_activo_id       | uuid                     |
| activos_fijos      | cuenta_depreciacion_id | uuid                     |
| activos_fijos      | cuenta_gasto_id        | uuid                     |
| activos_fijos      | ubicacion              | character varying        |
| activos_fijos      | numero_serie           | character varying        |
| activos_fijos      | proveedor              | character varying        |
| activos_fijos      | activo                 | boolean                  |
| activos_fijos      | created_at             | timestamp with time zone |
| activos_fijos      | updated_at             | timestamp with time zone |
| asientos_contables | id                     | uuid                     |
| asientos_contables | empresa_id             | uuid                     |
| asientos_contables | periodo_id             | uuid                     |
| asientos_contables | numero_asiento         | character varying        |
| asientos_contables | fecha                  | date                     |
| asientos_contables | descripcion            | text                     |
| asientos_contables | tipo                   | USER-DEFINED             |
| asientos_contables | referencia_id          | uuid                     |
| asientos_contables | referencia_tipo        | character varying        |
| asientos_contables | glosa                  | text                     |
| asientos_contables | estado                 | USER-DEFINED             |
| asientos_contables | creado_por             | uuid                     |
| asientos_contables | aprobado_por           | uuid                     |
| asientos_contables | fecha_aprobacion       | timestamp with time zone |
| asientos_contables | created_at             | timestamp with time zone |
| audit_logs         | id                     | uuid                     |
| audit_logs         | empresa_id             | uuid                     |
| audit_logs         | usuario_id             | uuid                     |
| audit_logs         | operacion              | USER-DEFINED             |
| audit_logs         | tabla_afectada         | character varying        |
| audit_logs         | registro_id            | uuid                     |
| audit_logs         | datos_anteriores       | jsonb                    |
| audit_logs         | datos_nuevos           | jsonb                    |
| audit_logs         | ip_address             | inet                     |
| audit_logs         | user_agent             | text                     |
| audit_logs         | descripcion            | text                     |
| audit_logs         | created_at             | timestamp with time zone |
| clientes           | id                     | uuid                     |
| clientes           | empresa_id             | uuid                     |
| clientes           | nombre_razon_social    | character varying        |
| clientes           | nit_ci                 | character varying        |
| clientes           | complemento            | character varying        |
| clientes           | email                  | character varying        |
| clientes           | telefono               | character varying        |
| clientes           | direccion              | text                     |
| clientes           | es_empresa             | boolean                  |
| clientes           | activo                 | boolean                  |
| clientes           | created_at             | timestamp with time zone |
| clientes           | updated_at             | timestamp with time zone |
| cuentas_banco      | id                     | uuid                     |
| cuentas_banco      | empresa_id             | uuid                     |
| cuentas_banco      | cuenta_contable_id     | uuid                     |
| cuentas_banco      | banco                  | character varying        |
| cuentas_banco      | numero_cuenta          | character varying        |
| cuentas_banco      | tipo                   | character varying        |
| cuentas_banco      | moneda                 | character varying        |
| cuentas_banco      | saldo_libro            | numeric                  |
| cuentas_banco      | activo                 | boolean                  |
| cuentas_banco      | created_at             | timestamp with time zone |
| depreciaciones     | id                     | uuid                     |
| depreciaciones     | activo_id              | uuid                     |
| depreciaciones     | periodo_id             | uuid                     |
| depreciaciones     | fecha                  | date                     |
| depreciaciones     | ufv_inicio             | numeric                  |
| depreciaciones     | ufv_fin                | numeric                  |
| depreciaciones     | valor_inicial_ufv      | numeric                  |
| depreciaciones     | valor_final_ufv        | numeric                  |
| depreciaciones     | actualizacion_valor    | numeric                  |
| depreciaciones     | depreciacion_periodo   | numeric                  |
| depreciaciones     | depreciacion_acumulada | numeric                  |
| depreciaciones     | valor_libros           | numeric                  |
| depreciaciones     | asiento_id             | uuid                     |
| depreciaciones     | created_at             | timestamp with time zone |
| detalle_asientos   | id                     | uuid                     |
| detalle_asientos   | asiento_id             | uuid                     |
| detalle_asientos   | cuenta_id              | uuid                     |
| detalle_asientos   | debe                   | numeric                  |
| detalle_asientos   | haber                  | numeric                  |
| detalle_asientos   | glosa                  | text                     |
| detalle_asientos   | orden                  | smallint                 |
| detalle_facturas   | id                     | uuid                     |
| detalle_facturas   | factura_id             | uuid                     |
| detalle_facturas   | producto_id            | uuid                     |
| detalle_facturas   | descripcion            | character varying        |
| detalle_facturas   | cantidad               | numeric                  |
| detalle_facturas   | unidad_medida          | character varying        |
| detalle_facturas   | precio_unitario        | numeric                  |
| detalle_facturas   | descuento              | numeric                  |