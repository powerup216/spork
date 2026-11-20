import crc32 from './crc.js';
import usages from './usages.js';
import examples from './examples.js';

const REPORT_ID_CONFIG = 100;
const REPORT_ID_MONITOR = 101;
const STICKY_FLAG = 1 << 0;
const TAP_FLAG = 1 << 1;
const HOLD_FLAG = 1 << 2;
const CONFIG_SIZE = 32;
const CONFIG_VERSION = 19;  // MicDrop: 12 expressions and profiles; boards on version 18 still work
const VENDOR_ID = 0xCAFE;
const PRODUCT_ID = 0xBAF2;
const DEFAULT_PARTIAL_SCROLL_TIMEOUT = 1000000;
const DEFAULT_TAP_HOLD_THRESHOLD = 200000;
const DEFAULT_GPIO_DEBOUNCE_TIME = 5;
const DEFAULT_SCALING = 1000;
const DEFAULT_MACRO_ENTRY_DURATION = 1;

const NLAYERS = 8;
const NMACROS = 32;
const NEXPRESSIONS = 12;
const NEXPRESSIONS_V18 = 8;
const NPROFILES = 8;
const PROFILE_NAME_LEN = 20;
const MACRO_ITEMS_IN_PACKET = 6;
const IGNORE_AUTH_DEV_INPUTS_FLAG = 1 << 4;
const GPIO_OUTPUT_MODE_FLAG = 1 << 5;
const NORMALIZE_GAMEPAD_INPUTS_FLAG = 1 << 6;
const HUB_PORT_NONE = 255;

const QUIRK_FLAG_RELATIVE_MASK = 0b10000000;
const QUIRK_FLAG_SIGNED_MASK = 0b01000000;
const QUIRK_SIZE_MASK = 0b00111111;

const LAYERS_USAGE_PAGE = 0xFFF10000;
const EXPR_USAGE_PAGE = 0xFFF30000;
const MIDI_USAGE_PAGE = 0xFFF70000;
const BUTTON_USAGE_PAGE = 0x00090000;

const RESET_INTO_BOOTSEL = 1;
const SET_CONFIG = 2;
const GET_CONFIG = 3;
const CLEAR_MAPPING = 4;
const ADD_MAPPING = 5;
const GET_MAPPING = 6;
const PERSIST_CONFIG = 7;
const GET_OUR_USAGES = 8;
const GET_THEIR_USAGES = 9;
const SUSPEND = 10;
const RESUME = 11;
const PAIR_NEW_DEVICE = 12;
const CLEAR_BONDS = 13;
const FLASH_B_SIDE = 14;
const CLEAR_MACROS = 15;
const APPEND_TO_MACRO = 16;
const GET_MACRO = 17;
const INVALID_COMMAND = 18;
const CLEAR_EXPRESSIONS = 19;
const APPEND_TO_EXPRESSION = 20;
const GET_EXPRESSION = 21;
const SET_MONITOR_ENABLED = 22;
const CLEAR_QUIRKS = 23;
const ADD_QUIRK = 24;
const GET_QUIRK = 25;

const PROFILE_GET = 100;
const PROFILE_SWITCH = 101;
const PROFILE_SAVE_AS = 102;
const PROFILE_RENAME = 103;
const PROFILE_DELETE = 104;
const PROFILE_SET_DEFAULT = 105;
const PERSIST_CONFIG_SUCCESS = 1;
const PERSIST_CONFIG_CONFIG_TOO_BIG = 2;

const ops = {
    "PUSH": 0,
    "PUSH_USAGE": 1,
    "INPUT_STATE": 2,
    "ADD": 3,
    "MUL": 4,
    "EQ": 5,
    "TIME": 6,
    "MOD": 7,
    "GT": 8,
    "NOT": 9,
    "INPUT_STATE_BINARY": 10,
    "ABS": 11,
    "DUP": 12,
    "SIN": 13,
    "COS": 14,
    "DEBUG": 15,
    "AUTO_REPEAT": 16,
    "RELU": 17,
    "CLAMP": 18,
    "SCALING": 19,
    "LAYER_STATE": 20,
    "STICKY_STATE": 21,
    "TAP_STATE": 22,
    "HOLD_STATE": 23,
    "BITWISE_OR": 24,
    "BITWISE_AND": 25,
    "BITWISE_NOT": 26,
    "PREV_INPUT_STATE": 27,
    "PREV_INPUT_STATE_BINARY": 28,
    "STORE": 29,
    "RECALL": 30,
    "SQRT": 31,
    "ATAN2": 32,
    "ROUND": 33,
    "PORT": 34,
    "DPAD": 35,
    "EOL": 36,
    "INPUT_STATE_FP32": 37,
    "PREV_INPUT_STATE_FP32": 38,
    "MIN": 39,
    "MAX": 40,
    "IFTE": 41,
    "DIV": 42,
    "SWAP": 43,
    "MONITOR": 44,
    "SIGN": 45,
    "SUB": 46,
    "PRINT_IF": 47,
    "TIME_SEC": 48,
    "LT": 49,
    "PLUGGED_IN": 50,
    "INPUT_STATE_SCALED": 51,
    "PREV_INPUT_STATE_SCALED": 52,
    "DEADZONE": 53,
    "DEADZONE2": 54,
};

const opcodes = Object.fromEntries(Object.entries(ops).map(([key, value]) => [value, key]));

const expr_re = /((?:\/\*.*?\*\/)?)((?:(?!\/\*).)*)/gs;

const UINT8 = Symbol('uint8');
const UINT16 = Symbol('uint16');
const UINT32 = Symbol('uint32');
const INT32 = Symbol('int32');

let device = null;
// Settings version of the connected board: 19 (profiles, 12 expressions) or 18.
let device_version = CONFIG_VERSION;
function device_nexpressions() {
    return device_version >= 19 ? NEXPRESSIONS : NEXPRESSIONS_V18;
}
function device_has_profiles() {
    return device_version >= 19;
}
let source_modal = null;
let target_modal = null;
let extra_usages = { 'source': [], 'target': [] };
let config = {
    'version': CONFIG_VERSION,
    'unmapped_passthrough_layers': [0, 1, 2, 3, 4, 5, 6, 7],
    'partial_scroll_timeout': DEFAULT_PARTIAL_SCROLL_TIMEOUT,
    'tap_hold_threshold': DEFAULT_TAP_HOLD_THRESHOLD,
    'gpio_debounce_time_ms': DEFAULT_GPIO_DEBOUNCE_TIME,
    'interval_override': 0,
    'our_descriptor_number': 0,
    'ignore_auth_dev_inputs': false,
    'macro_entry_duration': DEFAULT_MACRO_ENTRY_DURATION,
    'gpio_output_mode': 0,
    'input_labels': 0,
    'normalize_gamepad_inputs': true,
    mappings: [{
        'source_usage': '0x00000000',
        'target_usage': '0x00000000',
        'layers': [0],
        'sticky': false,
        'tap': false,
        'hold': false,
        'scaling': DEFAULT_SCALING,
        'source_port': 0,
        'target_port': 0,
    }],
    macros: [
        [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [],
        [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []
    ],
    expressions: [
        '', '', '', '', '', '', '', '', '', '', '', ''
    ],
    quirks: [],
    port_devices: {},  // MicDrop: hub port -> device picture (kept on the board as placeholder mappings)
};
let monitor_enabled = false;
let monitor_min_val = {};
let monitor_max_val = {};
let unique_id_counter = 0;
let save_to_device_checkmark_timeout_id = null;
let busy = false;
const ignored_usages = new Set([
]);
let modal_return_mapping = null;
let modal_return_element = null;

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("open_serial_device").addEventListener("click", open_serial_device);
    document.getElementById("load_from_device").addEventListener("click", load_from_device);
    document.getElementById("save_to_device").addEventListener("click", save_to_device);
    document.getElementById("add_mapping").addEventListener("click", add_mapping_onclick);
    document.getElementById("download_json").addEventListener("click", download_json);
    document.getElementById("upload_json").addEventListener("click", upload_json);
    document.getElementById("flash_firmware").addEventListener("click", flash_firmware);
    document.getElementById("flash_b_side").addEventListener("click", flash_b_side);
    document.getElementById("pair_new_device").addEventListener("click", pair_new_device);
    document.getElementById("clear_bonds").addEventListener("click", clear_bonds);
    document.getElementById("monitor_clear").addEventListener("click", monitor_clear);
    document.getElementById("file_input").addEventListener("change", file_uploaded);
    document.getElementById("add_quirk").addEventListener("click", add_empty_quirk);
    document.getElementById("profile_save_as").addEventListener("click", profile_save_as);
    document.getElementById("nav-profiles-tab").addEventListener("shown.bs.tab", () => profile_action(refresh_profiles));

    device_buttons_set_disabled_state(true);

    document.getElementById("partial_scroll_timeout_input").addEventListener("change", partial_scroll_timeout_onchange);
    document.getElementById("tap_hold_threshold_input").addEventListener("change", tap_hold_threshold_onchange);
    document.getElementById("gpio_debounce_time_input").addEventListener("change", gpio_debounce_time_onchange);
    document.getElementById("macro_entry_duration_input").addEventListener("change", macro_entry_duration_onchange);
    for (let i = 0; i < NLAYERS; i++) {
        document.getElementById("unmapped_passthrough_checkbox" + i).addEventListener("change", unmapped_passthrough_onchange);
    }
    document.getElementById("interval_override_dropdown").addEventListener("change", interval_override_onchange);
    document.getElementById("our_descriptor_number_dropdown").addEventListener("change", our_descriptor_number_onchange);
    document.getElementById("gpio_output_mode_dropdown").addEventListener("change", gpio_output_mode_onchange);
    document.getElementById("input_labels_dropdown").addEventListener("change", input_labels_onchange("input_labels_dropdown"));
    document.getElementById("input_labels_modal_dropdown").addEventListener("change", input_labels_onchange("input_labels_modal_dropdown"));
    document.getElementById("ignore_auth_dev_inputs_checkbox").addEventListener("change", ignore_auth_dev_inputs_onchange);
    document.getElementById("normalize_gamepad_inputs_checkbox").addEventListener("change", normalize_gamepad_inputs_onchange);

    document.getElementById("nav-monitor-tab").addEventListener("shown.bs.tab", monitor_tab_shown);
    document.getElementById("nav-monitor-tab").addEventListener("hide.bs.tab", monitor_tab_hide);

    document.getElementById("input-column-header").addEventListener("click", sort_by(['source_port', 'source_usage', 'target_usage', 'layers']));
    document.getElementById("output-column-header").addEventListener("click", sort_by(['target_usage', 'source_port', 'source_usage', 'layers']));
    document.getElementById("layer-column-header").addEventListener("click", sort_by(['layers', 'source_port', 'source_usage', 'target_usage']));

    if ("serial" in navigator) {
        navigator.serial.addEventListener('disconnect', (event) => {
            if ((device instanceof SerialLink) && (event.target === device.port)) {
                device.close();
                device = null;
                device_buttons_set_disabled_state(true);
                refresh_profiles();
            }
        });
    }
    if ("hid" in navigator) {
        navigator.hid.addEventListener('disconnect', hid_on_disconnect);
    }
    if (!("serial" in navigator) && !("hid" in navigator)) {
        display_error("This browser can't talk to USB devices. Use a recent Chrome, Edge or Firefox.");
    }

    setup_examples();
    source_modal = new bootstrap.Modal(document.getElementById('source_usage_modal'), {});
    target_modal = new bootstrap.Modal(document.getElementById('target_usage_modal'), {});
    setup_macros();
    setup_expressions();
    set_ui_state();
    md_setup();
});

async function open_device() {
    if (busy) {
        return;
    }
    busy = true;

    clear_error();
    let success = false;

    try {
        const devices = await navigator.hid.requestDevice({
            filters: [{ usagePage: 0xFF00, usage: 0x0020 }]
        });
        const config_interface = devices?.find(d => d.collections.some(c => c.usagePage == 0xff00));
        if (config_interface !== undefined) {
            device = config_interface;
            if (!device.opened) {
                await device.open().catch((err) => { display_error(err + "\nIf you're on Linux, you might need to give yourself permissions to the appropriate /dev/hidraw* device."); });
            }
            success = device.opened;
            success &&= await device_opened();
        }
    } catch (e) {
        display_error(e);
    }

    device_buttons_set_disabled_state(!success);

    if (!success) {
        device = null;
    }

    busy = false;
}

async function open_serial_device() {
    if (busy) {
        return;
    }
    busy = true;

    clear_error();
    let success = false;

    try {
        const port = await navigator.serial.requestPort({
            filters: [{ usbVendorId: 0x05F3, usbProductId: 0x00FF }, { usbVendorId: 0x0554, usbProductId: 0x1001 }, { usbVendorId: 0x0554, usbProductId: 0x0064 },
                // standard HID Remapper device types
                { usbVendorId: 0xCAFE, usbProductId: 0xBAF2 }, { usbVendorId: 0x0F0D, usbProductId: 0x00C1 },
                { usbVendorId: 0x054C, usbProductId: 0x1234 }, { usbVendorId: 0x18D1, usbProductId: 0x9400 }]
        });
        const link = new SerialLink(port);
        await link.open();
        device = link;
        success = await device_opened();
    } catch (e) {
        if (e.name != 'NotFoundError') {
            display_error(e);
        }
    }

    device_buttons_set_disabled_state(!success);

    if (!success) {
        if (device instanceof SerialLink) {
            await device.close();
        }
        device = null;
    }

    busy = false;
}

let running_device_type = null;

async function device_opened() {
    if (!await check_device_version()) {
        return false;
    }
    // Remember which device type the board is running, so a save that changes
    // it can say the board will restart (it re-enumerates as the new device).
    await send_feature_command(GET_CONFIG);
    const running = await read_config_feature([UINT8, UINT8, UINT8, UINT32, UINT16, UINT32, UINT32, UINT8, UINT32, UINT8, UINT8]);
    running_device_type = running[10];
    device.addEventListener('inputreport', input_report_received);
    await set_monitor_enabled(monitor_enabled);
    await get_usages_from_device();
    setup_usages_modals();
    bluetooth_buttons_set_visibility(device.productName.includes("Bluetooth"));
    await refresh_profiles();
    return true;
}

// The PowerMic and foot pedal modes have no settings HID interface; the same 32-byte packets
// travel over its serial port. This wraps the port in the few HIDDevice
// calls the rest of the page uses.
class SerialLink {
    constructor(port) {
        this.port = port;
        this.opened = false;
        this.productName = 'MicDrop';
        this.collections = [];
        this.listeners = [];
        this.rx = [];
        this.replies = [];
    }

    async open() {
        await this.port.open({ baudRate: 115200 });
        await this.port.setSignals({ dataTerminalReady: true, requestToSend: true }).catch(() => { });
        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader();
        this.opened = true;
        this.read_loop();
        await this.writer.write(new Uint8Array(33));
    }

    async close() {
        this.opened = false;
        try { await this.reader?.cancel(); } catch (e) { }
        try { this.reader?.releaseLock(); } catch (e) { }
        try { this.writer?.releaseLock(); } catch (e) { }
        try { await this.port.close(); } catch (e) { }
    }

    async read_loop() {
        try {
            while (this.opened) {
                const { value, done } = await this.reader.read();
                if (done) {
                    break;
                }
                for (const b of value) {
                    this.rx.push(b);
                }
                this.parse();
            }
        } catch (e) {
        }
        this.opened = false;
        for (const r of this.replies.splice(0)) {
            r.reject(new Error('Device disconnected.'));
        }
        if (device === this) {
            device = null;
            device_buttons_set_disabled_state(true);
        }
    }

    parse() {
        while (this.rx.length > 0) {
            const type = this.rx[0];
            if (type == 0x52) {
                if (this.rx.length < 33) {
                    return;
                }
                const frame = this.rx.splice(0, 33);
                const r = this.replies.shift();
                if (r) {
                    clearTimeout(r.timer);
                    r.resolve(Uint8Array.from([REPORT_ID_CONFIG, ...frame.slice(1)]));
                }
            } else if (type == 0x4D) {
                if (this.rx.length < 65) {
                    return;
                }
                const frame = this.rx.splice(0, 65);
                const event = { reportId: frame[1], data: new DataView(Uint8Array.from(frame.slice(2)).buffer) };
                for (const l of this.listeners) {
                    l(event);
                }
            } else {
                this.rx.shift();
            }
        }
    }

    addEventListener(name, listener) {
        if (name == 'inputreport' && !this.listeners.includes(listener)) {
            this.listeners.push(listener);
        }
    }

    async sendFeatureReport(report_id, data) {
        const bytes = new Uint8Array(data instanceof ArrayBuffer ? data : data.buffer);
        await this.writer.write(Uint8Array.from([0x53, ...bytes.slice(0, CONFIG_SIZE)]));
    }

    async receiveFeatureReport(report_id) {
        const reply = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.replies = this.replies.filter(r => r.timer !== timer);
                reject(new Error('No answer from the device.'));
            }, 3000);
            this.replies.push({ resolve, reject, timer });
        });
        await this.writer.write(Uint8Array.from([0x47]));
        const bytes = await reply;
        return new DataView(bytes.buffer);
    }
}

async function load_from_device() {
    if (device == null) {
        return;
    }

    if (busy) {
        return;
    }
    busy = true;

    clear_error();

    document.getElementById('load_from_device').disabled = true;

    try {
        await send_feature_command(GET_CONFIG);
        const [config_version, flags, unmapped_passthrough_layer_mask, partial_scroll_timeout, mapping_count, our_usage_count, their_usage_count, interval_override, tap_hold_threshold, gpio_debounce_time_ms, our_descriptor_number, macro_entry_duration, quirk_count] =
            await read_config_feature([UINT8, UINT8, UINT8, UINT32, UINT16, UINT32, UINT32, UINT8, UINT32, UINT8, UINT8, UINT8, UINT16]);
        check_received_version(config_version);

        config['version'] = config_version;
        config['unmapped_passthrough_layers'] = mask_to_layer_list(unmapped_passthrough_layer_mask);
        config['partial_scroll_timeout'] = partial_scroll_timeout;
        config['tap_hold_threshold'] = tap_hold_threshold;
        config['gpio_debounce_time_ms'] = gpio_debounce_time_ms;
        config['interval_override'] = interval_override;
        config['our_descriptor_number'] = our_descriptor_number;
        config['ignore_auth_dev_inputs'] = !!(flags & IGNORE_AUTH_DEV_INPUTS_FLAG);
        config['gpio_output_mode'] = (flags & GPIO_OUTPUT_MODE_FLAG) ? 1 : 0;
        config['normalize_gamepad_inputs'] = !!(flags & NORMALIZE_GAMEPAD_INPUTS_FLAG);
        config['macro_entry_duration'] = macro_entry_duration + 1;
        config['mappings'] = [];

        for (let i = 0; i < mapping_count; i++) {
            await send_feature_command(GET_MAPPING, [[UINT32, i]]);
            const [target_usage, source_usage, scaling, layer_mask, mapping_flags, hub_ports] =
                await read_config_feature([UINT32, UINT32, INT32, UINT8, UINT8, UINT8]);
            config['mappings'].push({
                'target_usage': '0x' + target_usage.toString(16).padStart(8, '0'),
                'source_usage': '0x' + source_usage.toString(16).padStart(8, '0'),
                'scaling': scaling,
                'layers': mask_to_layer_list(layer_mask),
                'sticky': (mapping_flags & STICKY_FLAG) != 0,
                'tap': (mapping_flags & TAP_FLAG) != 0,
                'hold': (mapping_flags & HOLD_FLAG) != 0,
                'source_port': hub_ports & 0x0F,
                'target_port': (hub_ports >> 4) & 0x0F,
            });
        }

        config['macros'] = [];

        for (let macro_i = 0; macro_i < NMACROS; macro_i++) {
            let macro = [];
            let i = 0;
            let keep_going = true;
            while (keep_going) {
                await send_feature_command(GET_MACRO, [[UINT32, macro_i], [UINT32, i]]);
                const fields = await read_config_feature([UINT8, UINT32, UINT32, UINT32, UINT32, UINT32, UINT32]);
                const nitems = fields[0];
                const usages_ = fields.slice(1);
                if (nitems < MACRO_ITEMS_IN_PACKET) {
                    keep_going = false;
                }
                if ((macro.length == 0) && (nitems > 0)) {
                    macro = [[]];
                }
                for (const usage of usages_.slice(0, nitems)) {
                    if (usage == 0) {
                        macro.push([]);
                    } else {
                        macro.at(-1).push('0x' + usage.toString(16).padStart(8, '0'));
                    }
                }
                i += MACRO_ITEMS_IN_PACKET;
            }

            config['macros'].push(macro);
        }

        config['expressions'] = [];

        for (let expr_i = 0; expr_i < device_nexpressions(); expr_i++) {
            let expression = [];
            let i = 0;
            while (true) {
                await send_feature_command(GET_EXPRESSION, [[UINT32, expr_i], [UINT32, i]]);
                const fields = await read_config_feature([UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8]);
                const nelems = fields[0];
                if (nelems == 0) {
                    break;
                }
                let elems = fields.slice(1);
                for (let j = 0; j < nelems; j++) {
                    const elem = elems[0];
                    elems = elems.slice(1);
                    if ([ops['PUSH'], ops['PUSH_USAGE']].includes(elem)) {
                        const val = elems[3] << 24 | elems[2] << 16 | elems[1] << 8 | elems[0];
                        elems = elems.slice(4);
                        if (elem == ops['PUSH']) {
                            expression.push(val.toString());
                        } else {
                            expression.push('0x' + (val >>> 0).toString(16).padStart(8, '0'));
                        }
                    } else {
                        expression.push(opcodes[elem].toLowerCase());
                    }
                }
                i += nelems;
            }

            config['expressions'].push(expression.join(' '));
        }
        pad_expressions();
        config['port_devices'] = {};
        extract_port_devices();
        // the page always works in the current format (v19 = v18 + 4 expressions)
        config['version'] = CONFIG_VERSION;

        config['quirks'] = [];

        for (let quirk_i = 0; quirk_i < quirk_count; quirk_i++) {
            await send_feature_command(GET_QUIRK, [[UINT32, quirk_i]]);
            const [vendor_id, product_id, interface_, report_id, usage, bitpos, size_flags] =
                await read_config_feature([UINT16, UINT16, UINT8, UINT8, UINT32, UINT16, UINT8]);
            config['quirks'].push({
                'vendor_id': '0x' + vendor_id.toString(16).padStart(4, '0'),
                'product_id': '0x' + product_id.toString(16).padStart(4, '0'),
                'interface': interface_,
                'report_id': report_id,
                'usage': '0x' + usage.toString(16).padStart(8, '0'),
                'bitpos': bitpos,
                'size': size_flags & QUIRK_SIZE_MASK,
                'relative': (size_flags & QUIRK_FLAG_RELATIVE_MASK) != 0,
                'signed': (size_flags & QUIRK_FLAG_SIGNED_MASK) != 0,
            });
        }

        set_ui_state();
        validate_ui_expressions();
    } catch (e) {
        display_error(e);
    }

    if (device != null) {
        document.getElementById('load_from_device').disabled = false;
    }

    busy = false;
}

// Sends the settings on this page to the board (it keeps them in RAM, suspended,
// until RESUME). Saving or "save as profile" follows.
async function send_config_to_device() {
    if ((device_nexpressions() < NEXPRESSIONS) &&
        config['expressions'].slice(device_nexpressions()).some((e) => e.trim() != '')) {
        display_info('Expressions 9-12 are not saved: this board needs the latest MicDrop firmware for them.');
    }
    await send_feature_command(SUSPEND);
    const flags = (config['ignore_auth_dev_inputs'] ? IGNORE_AUTH_DEV_INPUTS_FLAG : 0) |
        (config['gpio_output_mode'] ? GPIO_OUTPUT_MODE_FLAG : 0) |
        (config['normalize_gamepad_inputs'] ? NORMALIZE_GAMEPAD_INPUTS_FLAG : 0);
    await send_feature_command(SET_CONFIG, [
        [UINT8, flags],
        [UINT8, layer_list_to_mask(config['unmapped_passthrough_layers'])],
        [UINT32, config['partial_scroll_timeout']],
        [UINT8, config['interval_override']],
        [UINT32, config['tap_hold_threshold']],
        [UINT8, config['gpio_debounce_time_ms']],
        [UINT8, config['our_descriptor_number']],
        [UINT8, config['macro_entry_duration'] - 1],
    ]);
    await send_feature_command(CLEAR_MAPPING);

    for (const mapping of config['mappings'].concat(port_device_mappings())) {
        await send_feature_command(ADD_MAPPING, [
            [UINT32, parseInt(mapping['target_usage'], 16)],
            [UINT32, parseInt(mapping['source_usage'], 16)],
            [INT32, mapping['scaling']],
            [UINT8, layer_list_to_mask(mapping['layers'])],
            [UINT8, (mapping['sticky'] ? STICKY_FLAG : 0)
                | (mapping['tap'] ? TAP_FLAG : 0)
                | (mapping['hold'] ? HOLD_FLAG : 0)],
            [UINT8, ((mapping['target_port'] & 0x0F) << 4) | (mapping['source_port'] & 0x0F)],
        ]);
    }

    await send_feature_command(CLEAR_MACROS);
    let macro_i = 0;
    for (const macro of config['macros']) {
        if (macro_i >= NMACROS) {
            break;
        }

        const flat_zero_separated = macro.map((x) => x.concat(["0x00"])).flat().slice(0, -1);

        for (let i = 0; i < flat_zero_separated.length; i += MACRO_ITEMS_IN_PACKET) {
            const chunk_size = i + MACRO_ITEMS_IN_PACKET > flat_zero_separated.length
                ? flat_zero_separated.length - i
                : MACRO_ITEMS_IN_PACKET;
            await send_feature_command(APPEND_TO_MACRO,
                [[UINT8, macro_i], [UINT8, chunk_size]].concat(
                    flat_zero_separated
                        .slice(i, i + chunk_size)
                        .map((x) => [UINT32, parseInt(x, 16)])));
        }

        macro_i++;
    }

    await send_feature_command(CLEAR_EXPRESSIONS);
    let expr_i = 0;
    for (const expr of config['expressions']) {
        if (expr_i >= device_nexpressions()) {
            break;
        }

        let elems = expr_to_elems(expr);
        while (elems.length > 0) {
            let bytes_left = 24;
            let items_to_send = [];
            let nelems = 0;
            while ((elems.length > 0) && (bytes_left > 0)) {
                const elem = elems[0];
                if ([ops["PUSH"], ops["PUSH_USAGE"]].includes(elem[0])) {
                    if (bytes_left >= 5) {
                        items_to_send.push([UINT8, elem[0]]);
                        items_to_send.push([UINT32, elem[1] >>> 0]);
                        bytes_left -= 5;
                        nelems++;
                        elems = elems.slice(1);
                    } else {
                        break
                    }
                } else {
                    items_to_send.push([UINT8, elem[0]]);
                    bytes_left--;
                    nelems++;
                    elems = elems.slice(1);
                }
            }
            await send_feature_command(APPEND_TO_EXPRESSION,
                [[UINT8, expr_i], [UINT8, nelems]].concat(items_to_send));
        }

        expr_i++;
    }

    await send_feature_command(CLEAR_QUIRKS);
    for (const quirk of config['quirks']) {
        const size_flags = (quirk['size'] & QUIRK_SIZE_MASK) |
            (quirk['relative'] ? QUIRK_FLAG_RELATIVE_MASK : 0) |
            (quirk['signed'] ? QUIRK_FLAG_SIGNED_MASK : 0);
        await send_feature_command(ADD_QUIRK, [
            [UINT16, parseInt(quirk['vendor_id'], 16)],
            [UINT16, parseInt(quirk['product_id'], 16)],
            [UINT8, quirk['interface']],
            [UINT8, quirk['report_id']],
            [UINT32, parseInt(quirk['usage'], 16)],
            [UINT16, quirk['bitpos']],
            [UINT8, size_flags],
        ]);
    }
}

async function save_to_device() {
    if (device == null) {
        return;
    }

    if (busy) {
        return;
    }
    busy = true;

    clear_error();

    document.getElementById('save_to_device').disabled = true;
    if (save_to_device_checkmark_timeout_id != null) {
        clearTimeout(save_to_device_checkmark_timeout_id);
    }
    document.getElementById('save_to_device_checkmark').classList.add('d-none');

    try {
        await send_config_to_device();

        await send_feature_command(PERSIST_CONFIG);

        let [persist_config_return_code] = await read_config_feature([UINT8]);

        await send_feature_command(RESUME);

        switch (persist_config_return_code) {
            case PERSIST_CONFIG_SUCCESS:
                if ((running_device_type !== null) && (config['our_descriptor_number'] != running_device_type)) {
                    display_info('Saved. The board is restarting as the new device type. Wait a few seconds, then click Open device again (with older firmware, unplug and replug the board first).');
                    running_device_type = null;
                } else if (device_has_profiles()) {
                    await refresh_profiles();
                }
                document.getElementById('save_to_device_checkmark').classList.remove('d-none');
                save_to_device_checkmark_timeout_id = setTimeout(() => {
                    document.getElementById('save_to_device_checkmark').classList.add('d-none');
                    save_to_device_checkmark_timeout_id = null;
                }, 3000);
                break;
            case PERSIST_CONFIG_CONFIG_TOO_BIG:
                display_error('Configuration too big to persist.');
                break;
            default:
                throw new Error('Unknown PERSIST_CONFIG return code (' + return_code + ').');
        }
    } catch (e) {
        display_error(e);
    }

    if (device != null) {
        document.getElementById('save_to_device').disabled = false;
    }

    busy = false;
}

async function do_get_usages_from_device(command, rle_count) {
    const extra_usage_set = new Set();
    let i = 0;
    while (i < rle_count) {
        await send_feature_command(command, [[UINT32, i]]);
        const fields = await read_config_feature([UINT32, UINT32, UINT32, UINT32, UINT32, UINT32]);

        for (let j = 0; j < 3; j++) {
            const usage = fields[2 * j];
            const count = fields[2 * j + 1];
            if (usage != 0) {
                for (let k = 0; k < count; k++) {
                    const u = '0x' + (usage + k).toString(16).padStart(8, '0');
                    if (!ignored_usages.has(u)) {
                        extra_usage_set.add(u);
                    }
                }
            }
        }

        i += 3;
    }

    const extra_usages_ = Array.from(extra_usage_set);
    extra_usages_.sort();
    return extra_usages_;
}

async function get_usages_from_device() {
    await send_feature_command(GET_CONFIG);
    const [config_version, flags, unmapped_passthrough_layer_mask, partial_scroll_timeout, mapping_count, our_usage_count, their_usage_count, interval_override, tap_hold_threshold, gpio_debounce_time_ms, our_descriptor_number, macro_entry_duration, quirk_count] =
        await read_config_feature([UINT8, UINT8, UINT8, UINT32, UINT16, UINT32, UINT32, UINT8, UINT32, UINT8, UINT8, UINT8, UINT16]);
    check_received_version(config_version);

    extra_usages['target'] =
        await do_get_usages_from_device(GET_OUR_USAGES, our_usage_count);
    extra_usages['source'] =
        await do_get_usages_from_device(GET_THEIR_USAGES, their_usage_count);
}

function set_config_ui_state() {
    document.getElementById('partial_scroll_timeout_input').value = Math.round(config['partial_scroll_timeout'] / 1000);
    document.getElementById('tap_hold_threshold_input').value = Math.round(config['tap_hold_threshold'] / 1000);
    document.getElementById('gpio_debounce_time_input').value = config['gpio_debounce_time_ms'];
    for (let i = 0; i < NLAYERS; i++) {
        document.getElementById('unmapped_passthrough_checkbox' + i).checked =
            config['unmapped_passthrough_layers'].includes(i);
    }
    document.getElementById('interval_override_dropdown').value = config['interval_override'];
    document.getElementById('our_descriptor_number_dropdown').value = config['our_descriptor_number'];
    document.getElementById('ignore_auth_dev_inputs_checkbox').checked = config['ignore_auth_dev_inputs'];
    document.getElementById('macro_entry_duration_input').value = config['macro_entry_duration'];
    document.getElementById('gpio_output_mode_dropdown').value = config['gpio_output_mode'];
    document.getElementById('input_labels_dropdown').value = config['input_labels'];
    document.getElementById('input_labels_modal_dropdown').value = config['input_labels'];
    document.getElementById('normalize_gamepad_inputs_checkbox').checked = config['normalize_gamepad_inputs'];
}

function set_mappings_ui_state() {
    clear_children(document.getElementById('mappings'));
    for (const mapping of config['mappings']) {
        add_mapping(mapping);
    }
    md_refresh_soon();
}

function set_macros_ui_state() {
    let macro_i = 0;
    for (const macro of config['macros']) {
        if (macro_i >= NMACROS) {
            break;
        }

        const macro_element = document.getElementById('macro_' + macro_i);
        const macro_entries = macro_element.querySelector('.macro_entries');
        clear_children(macro_entries);
        for (const entry of macro) {
            const entry_element = add_macro_entry(macro_element);
            for (const item of entry) {
                const item_element = add_macro_item(entry_element);
                const usage_button_element = item_element.querySelector('.macro_item_usage');
                usage_button_element.querySelector('.button_label').innerText = readable_target_usage_name(item);
                usage_button_element.title = item;
                usage_button_element.setAttribute('data-hid-usage', item);
            }
            if (entry.length == 0) {
                add_macro_item(entry_element);
            }
        }

        macro_i++;
    }
    set_macro_previews();
}

function set_macro_previews() {
    for (let i = 0; i < NMACROS; i++) {
        const macro_element = document.getElementById('macro_' + i);
        const preview = Array.from(macro_element.querySelectorAll('.macro_entry'),
            (entry_element) => Array.from(entry_element.querySelectorAll('.macro_item_usage .button_label'),
                (item_element) => item_element.innerText == "Nothing" ? "∅" : item_element.innerText
            ).join('+')).join(', ');
        macro_element.querySelector('.macro_preview').innerText = preview;
    }
}

function set_expressions_ui_state() {
    const json_to_ui = function (op) {
        if (op.toLowerCase().startsWith('0x')) {
            return op;
        }
        if (/^[0-9-]/.test(op)) {
            return (parseInt(op, 10) / 1000).toString();
        }
        if (op.toLowerCase() == 'eol') {
            return '\n';
        }
        return op;
    }

    let expr_i = 0;
    for (const expr of config['expressions']) {
        if (expr_i >= NEXPRESSIONS) {
            break;
        }

        const expression_input = document.getElementById('expression_' + expr_i).querySelector('.expression_input');
        const expression_text = [...expr.matchAll(expr_re).map(x => x[1] + x[2].split(/\s+/).map(json_to_ui).join(' ').replace(/( )?\n /g, '\n'))].join('');
        expression_input.value = expression_text;

        const eols = expression_text.match(/\n/g);
        // This doesn't take wrapped lines into consideration.
        expression_input.rows = eols == null ? 1 : eols.length + 1;

        expr_i++;
    }
}

function set_ui_state() {
    if (config['version'] == 3) {
        config['unmapped_passthrough_layers'] = config['unmapped_passthrough'] ? [0] : [];
        delete config['unmapped_passthrough'];
        for (const mapping of config['mappings']) {
            mapping['layers'] = [mapping['layer']];
            delete mapping['layer'];
        }
        config['macros'] = [[], [], [], [], [], [], [], []];
    }
    if (config['version'] < 5) {
        for (const mapping of config['mappings']) {
            mapping['tap'] = false;
            mapping['hold'] = false;
        }
        config['tap_hold_threshold'] = DEFAULT_TAP_HOLD_THRESHOLD;
    }
    if (config['version'] < 6) {
        config['expressions'] = ['', '', '', '', '', '', '', ''];
    }
    if (config['version'] < 7) {
        while (config['macros'].length < NMACROS) {
            config['macros'].push([]);
        }
        config['gpio_debounce_time_ms'] = DEFAULT_GPIO_DEBOUNCE_TIME;
    }
    if (config['version'] < 9) {
        config['our_descriptor_number'] = 0;
        config['ignore_auth_dev_inputs'] = false;
    }
    if (config['version'] < 10) {
        config['macro_entry_duration'] = DEFAULT_MACRO_ENTRY_DURATION;
        config['gpio_output_mode'] = 0;
    }
    if (config['version'] < 11) {
        for (const mapping of config['mappings']) {
            mapping['source_port'] = 0;
            mapping['target_port'] = 0;
        }
    }
    if (config['version'] < 12) {
        config['quirks'] = [];
    }
    if (config['version'] < 16) {
        config['input_labels'] = 0;
    }
    if (config['version'] < 18) {
        // Normalize gamepad inputs defaults to true, but if we're loading a <18 config,
        // set it to false to preserve previous behavior.
        config['normalize_gamepad_inputs'] = false;
    }
    if (config['version'] < CONFIG_VERSION) {
        config['version'] = CONFIG_VERSION;
    }
    pad_expressions();
    extract_port_devices();

    set_config_ui_state();
    set_mappings_ui_state();
    set_macros_ui_state();
    set_expressions_ui_state();
    set_quirks_ui_state();
    setup_usages_modals();
}

function set_port_badge(button_element, port) {
    const port_badge = button_element.querySelector('.hub_port_badge');
    port_badge.innerText = port;
    if (port == 0) {
        port_badge.classList.add('d-none');
    } else {
        port_badge.classList.remove('d-none');
    }
}

function add_mapping(mapping) {
    const template = document.getElementById("mapping_template");
    const container = document.getElementById("mappings");
    const clone = template.content.cloneNode(true).firstElementChild;
    clone.querySelector(".delete_button").addEventListener("click", delete_mapping(mapping, clone));
    const sticky_checkbox = clone.querySelector(".sticky_checkbox");
    sticky_checkbox.checked = mapping['sticky'];
    sticky_checkbox.addEventListener("change", sticky_onclick(mapping, sticky_checkbox));
    const tap_checkbox = clone.querySelector(".tap_checkbox");
    tap_checkbox.checked = mapping['tap'];
    tap_checkbox.addEventListener("change", tap_onclick(mapping, tap_checkbox));
    const hold_checkbox = clone.querySelector(".hold_checkbox");
    hold_checkbox.checked = mapping['hold'];
    hold_checkbox.addEventListener("change", hold_onclick(mapping, hold_checkbox));
    const scaling_input = clone.querySelector(".scaling_input");
    scaling_input.value = mapping['scaling'] / 1000;
    scaling_input.addEventListener("input", scaling_onchange(mapping, scaling_input));
    for (let i = 0; i < NLAYERS; i++) {
        const layer_checkbox = clone.querySelector(".layer_checkbox" + i);
        layer_checkbox.checked = mapping['layers'].includes(i);
        layer_checkbox.addEventListener("change", layer_checkbox_onchange(mapping, layer_checkbox, i));
    }
    const source_button = clone.querySelector(".source_button");
    source_button.querySelector('.button_label').innerText =
        'source_name' in mapping ? mapping['source_name'] : readable_usage_name(mapping['source_usage']);
    source_button.setAttribute('data-hid-usage', mapping['source_usage']);
    source_button.title = mapping['source_usage'];
    source_button.addEventListener("click", show_usage_modal(mapping, 'source', clone));
    set_port_badge(source_button, mapping['source_port']);
    const target_button = clone.querySelector(".target_button");
    target_button.querySelector('.button_label').innerText = readable_target_usage_name(mapping['target_usage']);
    target_button.setAttribute('data-hid-usage', mapping['target_usage']);
    target_button.title = mapping['target_usage'];
    target_button.addEventListener("click", show_usage_modal(mapping, 'target', clone));
    set_port_badge(target_button, mapping['target_port']);
    container.appendChild(clone);
    set_forced_layers(mapping, clone);
    set_forced_flags(mapping, clone);
    if (modal_return_mapping === mapping) {
        modal_return_element = clone;
    }
}

function download_json() {
    clear_error();
    let element = document.createElement('a');
    element.setAttribute('href', 'data:application/json,' + encodeURIComponent(JSON.stringify(config, null, 4)));
    element.setAttribute('download', 'hid-remapper-config.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function upload_json() {
    clear_error();
    document.getElementById("file_input").click();
}

async function flash_firmware() {
    display_error("HID Remapper should now be in firmware flashing mode. Copy UF2 file to the drive that appeared. If you don't want to flash new firmware at this time, just unplug and replug the device.");
    await send_feature_command(RESET_INTO_BOOTSEL);
}

async function flash_b_side() {
    display_error("Side B should now be flashed with firmware version matching side A. Disconnect and reconnect the device.");
    await send_feature_command(FLASH_B_SIDE);
}

async function pair_new_device() {
    await send_feature_command(PAIR_NEW_DEVICE);
}

async function clear_bonds() {
    await send_feature_command(CLEAR_BONDS);
}

function file_uploaded() {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const new_config = JSON.parse(e.target.result);
            check_json_version(new_config['version']);
            config = new_config;
            set_ui_state();
            validate_ui_expressions();
            switch_to_mappings_tab();
        } catch (e) {
            display_error(e);
        }
    };

    const file = document.getElementById("file_input").files[0];
    if (file !== undefined) {
        reader.readAsText(file);
    }

    document.getElementById("file_input").value = '';
}

async function send_feature_command(command, fields = [], version = device_version) {
    let buffer = new ArrayBuffer(CONFIG_SIZE);
    let dataview = new DataView(buffer);
    dataview.setUint8(0, version);
    dataview.setUint8(1, command);
    let pos = 2;
    for (const [type, value] of fields) {
        switch (type) {
            case UINT8:
                dataview.setUint8(pos, value);
                pos += 1;
                break;
            case UINT16:
                dataview.setUint16(pos, value, true);
                pos += 2;
                break;
            case UINT32:
                dataview.setUint32(pos, value, true);
                pos += 4;
                break;
            case INT32:
                dataview.setInt32(pos, value, true);
                pos += 4;
                break;
        }
    }
    add_crc(dataview);

    await device.sendFeatureReport(REPORT_ID_CONFIG, buffer);
}

async function read_config_feature(fields = []) {
    let attempts_left = 10;
    let delay = 2;
    let data;
    while (true) {
        const data_with_report_id = await device.receiveFeatureReport(REPORT_ID_CONFIG);
        data = new DataView(data_with_report_id.buffer, 1);
        if (data.byteLength > 0) {
            break;
        } else {
            if ((--attempts_left) > 0) {
                await (new Promise(resolve => setTimeout(resolve, delay)));
                delay *= 2;
                continue;
            }
            throw new Error('Error in read_config_feature (given up retrying).');
        }
    }
    check_crc(data);
    let ret = [];
    let pos = 0;
    for (const type of fields) {
        switch (type) {
            case UINT8:
                ret.push(data.getUint8(pos));
                pos += 1;
                break;
            case UINT16:
                ret.push(data.getUint16(pos, true));
                pos += 2;
                break;
            case UINT32:
                ret.push(data.getUint32(pos, true));
                pos += 4;
                break;
            case INT32:
                ret.push(data.getInt32(pos, true));
                pos += 4;
                break;
        }
    }
    return ret;
}

function clear_error() {
    document.getElementById("error").classList.add("d-none");
    document.getElementById("error").classList.replace("alert-info", "alert-danger");
}

function display_info(message) {
    const e = document.getElementById("error");
    e.innerText = message;
    e.classList.replace("alert-danger", "alert-info");
    e.classList.remove("d-none");
}

function display_error(message) {
    document.getElementById("error").classList.replace("alert-info", "alert-danger");
    document.getElementById("error").innerText = message;
    document.getElementById("error").classList.remove("d-none");
}

function display_error_html(message) {
    document.getElementById("error").innerHTML = message;
    document.getElementById("error").classList.remove("d-none");
}

function check_crc(data) {
    if (data.getUint32(CONFIG_SIZE - 4, true) != crc32(data, CONFIG_SIZE - 4)) {
        throw new Error('CRC error.');
    }
}

function add_crc(data) {
    data.setUint32(CONFIG_SIZE - 4, crc32(data, CONFIG_SIZE - 4), true);
}

function check_json_version(config_version) {
    if (!([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].includes(config_version))) {
        throw new Error("Incompatible version.");
    }
}

function check_received_version(config_version) {
    if (config_version != device_version) {
        throw new Error("Incompatible version.");
    }
}

async function check_device_version() {
    // For versions <=3, this isn't a reliable way of checking the config version of the
    // device because it could be version X, ignore our GET_CONFIG call with version Y and
    // just happen to have Y at the right place in the buffer from some previous call done
    // by some other software.
    for (const version of [CONFIG_VERSION, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) {
        await send_feature_command(GET_CONFIG, [], version);
        const [received_version] = await read_config_feature([UINT8]);
        if (received_version == version) {
            if ((version == CONFIG_VERSION) || (version == 18)) {
                device_version = version;
                if (version == 18) {
                    display_info('This board has older MicDrop firmware. It works, but profiles and expressions 9-12 need the latest firmware.');
                }
                return true;
            }
            display_error_html('<p>Incompatible version (' + version + ').</p>' +
                '<p>Please consider upgrading your HID Remapper firmware to the <a href="https://github.com/jfedor2/hid-remapper/releases/latest">latest version</a>.</p>' +
                '<p>Alternatively, click <a href="v' + version + '/">here</a> for an older version of the configuration tool that should be compatible with your device.</p>' +
                '<p class="mb-0">(You can also use the older version of the configuration tool to put your HID Remapper in firmware flashing mode and upgrade the firmware.)</p>');
            return false;
        }
    }

    display_error_html('<p>Incompatible version.</p><p class="mb-0">You might have a newer version of the firmware on your HID Remapper than this configuration tool was made for.</p>');
    return false;
}

function clear_children(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function delete_mapping(mapping, element) {
    return function () {
        config['mappings'] = config['mappings'].filter(x => x !== mapping);
        document.getElementById("mappings").removeChild(element);
    };
}

function sticky_onclick(mapping, element) {
    return function () {
        mapping['sticky'] = element.checked;
        set_forced_layers(mapping, element.closest(".mapping_container"));
    };
}

function tap_onclick(mapping, element) {
    return function () {
        mapping['tap'] = element.checked;
    };
}

function hold_onclick(mapping, element) {
    return function () {
        mapping['hold'] = element.checked;
    };
}

function scaling_onchange(mapping, element) {
    return function () {
        mapping['scaling'] = element.value === '' ? DEFAULT_SCALING : Math.round(parseFloat(element.value) * 1000);
    };
}

function layer_checkbox_onchange(mapping, element, layer) {
    return function () {
        if (element.checked) {
            if (!mapping['layers'].includes(layer)) {
                mapping['layers'].push(layer)
                mapping['layers'].sort();
            }
        } else {
            mapping['layers'] = mapping['layers'].filter((x) => x != layer);
        }
    };
}

function expression_onchange(i) {
    const ui_to_json = function (op) {
        if (op.startsWith('/*')) {
            return op;
        }
        if (op.toLowerCase().startsWith('0x')) {
            if (isNaN(parseInt(op, 16))) {
                throw new Error('Invalid expression: "' + op + '"');
            }
            return op;
        }
        if (/^[0-9-]/.test(op)) {
            const x = parseFloat(op);
            if (isNaN(x)) {
                throw new Error('Invalid expression: "' + op + '"');
            }
            return Math.round(x * 1000).toString();
        }
        if ((op.toUpperCase() in ops) && !['PUSH', 'PUSH_USAGE'].includes(op.toUpperCase())) {
            return op.toLowerCase();
        }
        throw new Error('Invalid expression: "' + op + '"');
    }

    return function () {
        const expr_input = document.getElementById('expression_' + i).querySelector('.expression_input');
        try {
            config['expressions'][i] =
                [...expr_input.value.matchAll(expr_re).map(x => [
                    x[1],
                    ...x[2].replace(/\n/g, " eol ").split(/\s+/)
                ])].flat().filter((x) => (x.length > 0)).map(ui_to_json).join(' ');
            expr_input.classList.remove('is-invalid');
        } catch (e) {
            expr_input.classList.add('is-invalid');
            config['expressions'][i] = '';
        }
    }
}

function show_usage_modal(mapping_, source_or_target, element_) {
    return function () {
        // When set_mappings_ui_state() recreates the elements, it will update modal_return_element to
        // the correct element for the mapping we save in modal_return_mapping here.
        modal_return_mapping = mapping_;
        modal_return_element = element_;
        // XXX it would be better not to do this every time we show the modal
        const modal_element = document.getElementById(
            (source_or_target == 'source' ? 'source' : 'target') + '_usage_modal');
        const modal_ = source_or_target == 'source' ? source_modal : target_modal;
        modal_element.querySelectorAll('.usage_button').forEach((button) => {
            let clone = button.cloneNode(true);
            button.parentNode.replaceChild(clone, button); // to clear existing event listeners
            clone.addEventListener("click", function () {
                const mapping = modal_return_mapping;
                const element = (source_or_target == 'macro_item') ? modal_return_element :
                    modal_return_element.querySelector('.' + source_or_target + '_button');
                let usage = clone.getAttribute('data-hid-usage');
                if (mapping !== null) {
                    mapping[source_or_target + '_usage'] = usage;
                }
                element.querySelector('.button_label').innerText =
                    source_or_target == "source" ? readable_usage_name(usage) : readable_target_usage_name(usage);

                element.title = usage;

                if (source_or_target == "target") {
                    set_forced_layers(mapping, element.closest(".mapping_container"));
                }

                if (source_or_target == "source") {
                    set_forced_flags(mapping, element.closest(".mapping_container"));
                }

                if (source_or_target == "macro_item") {
                    element.setAttribute('data-hid-usage', usage);
                    set_macros_config_from_ui_state();
                }

                modal_.hide();
            });
        });
        const hub_port_container = modal_element.querySelector('.hub_port_container');
        if (source_or_target == "macro_item") {
            hub_port_container.querySelectorAll('.hub_port_inputs').forEach((x) => x.classList.add('d-none'));
        } else {
            if (source_or_target == "target") {
                hub_port_container.querySelectorAll('.hub_port_inputs').forEach((x) => x.classList.remove('d-none'));
            }
            const hub_port_dropdown = hub_port_container.querySelector('.hub_port_dropdown');
            const clone = hub_port_dropdown.cloneNode(true);
            hub_port_dropdown.parentElement.replaceChild(clone, hub_port_dropdown); // to clear existing event listeners
            clone.value = mapping_[source_or_target + '_port'];
            clone.addEventListener("change", function () {
                const mapping = modal_return_mapping;
                const element = modal_return_element.querySelector('.' + source_or_target + '_button');
                const hub_port = parseInt(clone.value, 10)
                set_port_badge(element, hub_port);
                mapping[source_or_target + '_port'] = hub_port;
            });
        }
        modal_.show();
    };
}

function add_empty_mapping(source_usage = '0x00000000') {
    let new_mapping = {
        'source_usage': source_usage,
        'target_usage': '0x00000000',
        'layers': [0],
        'sticky': false,
        'tap': false,
        'hold': false,
        'scaling': DEFAULT_SCALING,
        'source_port': 0,
        'target_port': 0,
    };
    config['mappings'].push(new_mapping);
    add_mapping(new_mapping);
}

function add_mapping_onclick() {
    add_empty_mapping();
}

function map_this_onclick(usage) {
    return function () {
        add_empty_mapping(usage);
        switch_to_mappings_tab();
        // XXX scroll to bottom and flash the mapping if we know how?
    }
}

function set_label_groups_visibility() {
    document.getElementById('source_usage_modal').querySelector('.mouse_usages').classList.toggle('d-none', config['input_labels'] != 0);
    document.getElementById('source_usage_modal').querySelector('.gamepad_usages').classList.toggle('d-none', config['input_labels'] != 1);
    usage_search_onchange(document.getElementById('source_usage_modal').querySelector('.usage_search_box'))();
}

function setup_usages_modals() {
    setup_usage_modal('source');
    setup_usage_modal('target');
    set_label_groups_visibility();
}

function setup_usage_modal(source_or_target) {
    const modal_element = document.getElementById(source_or_target + '_usage_modal');
    let usage_classes = {
        'mouse': modal_element.querySelector('.mouse_usages'),
        'gamepad': modal_element.querySelector('.gamepad_usages'),
        'keyboard': modal_element.querySelector('.keyboard_usages'),
        'media': modal_element.querySelector('.media_usages'),
        'powermic': modal_element.querySelector('.powermic_usages'),
        'other': modal_element.querySelector('.other_usages'),
        'extra': modal_element.querySelector('.extra_usages'),
    };
    for (const [usage_class, element] of Object.entries(usage_classes)) {
        clear_children(element);
    }
    let template = document.getElementById('usage_button_template');
    const add_usage_buttons = (relevant_usages) => {
        for (const [usage, usage_def] of Object.entries(relevant_usages)) {
            let clone = template.content.cloneNode(true).firstElementChild;
            clone.innerText = usage_def['name'];
            clone.title = usage;
            clone.setAttribute('data-hid-usage', usage);
            usage_classes[usage_def['class']].appendChild(clone);
        }
    }

    let known_usages;
    if (source_or_target == 'source') {
        add_usage_buttons(usages['source_0']);
        add_usage_buttons(usages['source_1']);
        add_usage_buttons(usages['source']);
        known_usages = { ...usages['source_0'], ...usages['source_1'], ...usages['source'] };
    } else {
        add_usage_buttons(usages[config['our_descriptor_number']]);
        known_usages = usages[config['our_descriptor_number']];
    }

    for (const usage_ of extra_usages[source_or_target]) {
        if (!(usage_ in known_usages)) {
            let clone = template.content.cloneNode(true).firstElementChild;
            clone.innerText = readable_usage_name(usage_);
            clone.title = usage_;
            clone.setAttribute('data-hid-usage', usage_);
            usage_classes['extra'].appendChild(clone);
        }
    }

    const search_box = modal_element.querySelector('.usage_search_box');
    search_box.addEventListener("keyup", usage_search_onchange(search_box));
    search_box.addEventListener("keydown", (e) => {
        if (e.key == 'Enter') {
            modal_element.querySelectorAll('.usage_button').forEach((usage_button) => {
                if (usage_button.hasAttribute('data-preferred-result')) {
                    usage_button.click();
                }
            });
        }
    });
    modal_element.addEventListener('show.bs.modal', () => {
        search_box.value = "";
        usage_search_onchange(search_box)();
    });
    modal_element.addEventListener('shown.bs.modal', () => {
        search_box.focus();
    });
}

function setup_macros() {
    const macros_container = document.getElementById('macros_container');
    let template = document.getElementById('macro_template');
    for (let i = 0; i < NMACROS; i++) {
        let clone = template.content.cloneNode(true).firstElementChild;
        clone.id = 'macro_' + i;
        clone.querySelector('.accordion-button').setAttribute('data-bs-target', '#collapse_' + i);
        clone.querySelector('.accordion-button').querySelector('.macro_name').innerText = 'Macro ' + (i + 1);
        clone.querySelector('.accordion-collapse').id = 'collapse_' + i;
        clone.querySelector('.add_macro_entry').addEventListener("click", () => {
            const entry_element = add_macro_entry(clone);
            add_macro_item(entry_element);
            set_macros_config_from_ui_state();
        });
        macros_container.appendChild(clone);
    }
}

function add_macro_entry(element) {
    const template = document.getElementById('macro_entry_template');
    const clone = template.content.cloneNode(true).firstElementChild;
    clone.querySelector('.add_macro_item').addEventListener("click", () => {
        add_macro_item(clone);
        set_macros_config_from_ui_state();
    });
    element.querySelector('.macro_entries').appendChild(clone);
    return clone;
}

function add_macro_item(element) {
    const template = document.getElementById('macro_item_template');
    const clone = template.content.cloneNode(true).firstElementChild;
    const button = clone.querySelector('.macro_item_usage');
    button.addEventListener("click", show_usage_modal(null, 'macro_item', button));
    clone.querySelector('.delete_macro_item').addEventListener("click", () => {
        delete_macro_item(clone);
        set_macros_config_from_ui_state();
    });
    element.insertBefore(clone, element.querySelector(".add_item_container"));
    return clone;
}

function delete_macro_item(element) {
    const parent = element.parentNode;
    parent.removeChild(element);
    if (parent.querySelectorAll('.macro_item').length == 0) {
        const macro_entry = parent.closest('.macro_entry');
        macro_entry.parentNode.removeChild(macro_entry);
    }
}

function set_macros_config_from_ui_state() {
    config['macros'] = [];
    for (let i = 0; i < NMACROS; i++) {
        let macro = [];
        const macro_element = document.querySelector('#macro_' + i);
        for (const entry_element of macro_element.querySelectorAll('.macro_entry')) {
            let entry = [];
            for (const item_element of entry_element.querySelectorAll('.macro_item_usage')) {
                const usage = item_element.getAttribute('data-hid-usage');
                if (usage != '0x00000000') {
                    entry.push(usage);
                }
            }
            macro.push(entry);
        }
        config['macros'].push(macro);
    }

    set_macro_previews();
}

// Configs from version 18 and older have 8 expressions; the page always has 12.
function pad_expressions() {
    while (config['expressions'].length < NEXPRESSIONS) {
        config['expressions'].push('');
    }
}

function setup_expressions() {
    const expr_container = document.getElementById('expressions_container');
    let template = document.getElementById('expression_template');
    for (let i = 0; i < NEXPRESSIONS; i++) {
        let clone = template.content.cloneNode(true).firstElementChild;
        clone.id = 'expression_' + i;
        clone.querySelector('.expression_label').innerText = 'Expression ' + (i + 1);
        clone.querySelector('.expression_input').addEventListener("input", expression_onchange(i));
        expr_container.appendChild(clone);
    }
}

function partial_scroll_timeout_onchange() {
    let value = document.getElementById('partial_scroll_timeout_input').value;
    if (value === '') {
        value = DEFAULT_PARTIAL_SCROLL_TIMEOUT;
    } else {
        value = Math.round(value * 1000);
    }
    config['partial_scroll_timeout'] = value;
}

function tap_hold_threshold_onchange() {
    let value = document.getElementById('tap_hold_threshold_input').value;
    if (value === '') {
        value = DEFAULT_TAP_HOLD_THRESHOLD;
    } else {
        value = Math.round(value * 1000);
    }
    config['tap_hold_threshold'] = value;
}

function gpio_debounce_time_onchange() {
    let value = parseInt(document.getElementById('gpio_debounce_time_input').value, 10);
    if (isNaN(value)) {
        value = DEFAULT_GPIO_DEBOUNCE_TIME;
    }
    config['gpio_debounce_time_ms'] = value;
}

function unmapped_passthrough_onchange() {
    config['unmapped_passthrough_layers'] = [];
    for (let i = 0; i < NLAYERS; i++) {
        if (document.getElementById("unmapped_passthrough_checkbox" + i).checked) {
            config['unmapped_passthrough_layers'].push(i);
        }
    }
}

function interval_override_onchange() {
    config['interval_override'] = parseInt(document.getElementById("interval_override_dropdown").value, 10);
}

function our_descriptor_number_onchange() {
    config['our_descriptor_number'] = parseInt(document.getElementById("our_descriptor_number_dropdown").value, 10);
    set_ui_state();
}

function gpio_output_mode_onchange() {
    config['gpio_output_mode'] = parseInt(document.getElementById("gpio_output_mode_dropdown").value, 10);
}

function ignore_auth_dev_inputs_onchange() {
    config['ignore_auth_dev_inputs'] = document.getElementById("ignore_auth_dev_inputs_checkbox").checked;
}

function normalize_gamepad_inputs_onchange() {
    config['normalize_gamepad_inputs'] = document.getElementById("normalize_gamepad_inputs_checkbox").checked;
}

function macro_entry_duration_onchange() {
    let value = parseInt(document.getElementById("macro_entry_duration_input").value, 10);
    if (isNaN(value)) {
        value = DEFAULT_MACRO_ENTRY_DURATION;
    }
    if (value < 1) {
        value = 1;
    }
    if (value > 256) {
        value = 256;
    }
    config['macro_entry_duration'] = value;
}

function input_labels_onchange(element_id) {
    return function () {
        config['input_labels'] = parseInt(document.getElementById(element_id).value, 10);
        document.getElementById("input_labels_dropdown").value = config['input_labels'];
        document.getElementById("input_labels_modal_dropdown").value = config['input_labels'];
        set_mappings_ui_state();
        set_label_groups_visibility();
    }
}

function load_example(n) {
    config = structuredClone(examples[n]['config']);
    set_ui_state();
    validate_ui_expressions();
    switch_to_mappings_tab();
}

function setup_examples() {
    const element = document.getElementById("examples");
    const template = document.getElementById("example_template");
    for (let i = 0; i < examples.length; i++) {
        const clone = template.content.cloneNode(true).firstElementChild;
        const link = clone.querySelector('a');
        link.innerText = examples[i]['description'];
        link.addEventListener("click", () => load_example(i));
        element.appendChild(clone);
    }
}

function hid_on_disconnect(event) {
    if (event.device === device) {
        device = null;
        device_buttons_set_disabled_state(true);
    }
}

function device_buttons_set_disabled_state(state) {
    const pill = document.getElementById("connection_pill");
    if (pill) {
        pill.textContent = state ? "Not connected" : "Connected";
        pill.classList.toggle("on", !state);
    }
    document.getElementById("load_from_device").disabled = state;
    document.getElementById("save_to_device").disabled = state;
    document.getElementById("flash_firmware").disabled = state;
    document.getElementById("flash_b_side").disabled = state;
    document.getElementById("pair_new_device").disabled = state;
    document.getElementById("clear_bonds").disabled = state;
}

function bluetooth_buttons_set_visibility(visible) {
    document.getElementById("pair_new_device_container").classList.toggle("d-none", !visible);
    document.getElementById("clear_bonds_container").classList.toggle("d-none", !visible);
    document.getElementById("flash_b_side_container").classList.toggle("d-none", visible);
}

function mask_to_layer_list(layer_mask) {
    let layers = [];
    for (let i = 0; i < NLAYERS; i++) {
        if ((layer_mask & (1 << i)) != 0) {
            layers.push(i);
        }
    }
    return layers;
}

function layer_list_to_mask(layers) {
    let layer_mask = 0;

    for (const layer of layers) {
        layer_mask |= (1 << layer);
    }

    return layer_mask;
}

function readable_usage_name(usage, default_to_hex = true) {
    if (usage in usages['source_' + config['input_labels']]) {
        return usages['source_' + config['input_labels']][usage]['name'];
    }
    if (usage in usages['source']) {
        return usages['source'][usage]['name'];
    }
    if (usage in usages['source_extra']) {
        return usages['source_extra'][usage]['name'];
    }
    if (((usage & 0xFFFF0000) >>> 0) == BUTTON_USAGE_PAGE) {
        return 'Button ' + (usage & 0xFFFF);
    }
    if (((usage & 0xFFFF0000) >>> 0) == MIDI_USAGE_PAGE) {
        const status = (usage >> 8) & 0xF0;
        const channel = (usage >> 8) & 0x0F;
        const prefix = 'MIDI CH' + channel;
        switch (status) {
            case 0x90:
                return prefix + ' note ' + (usage & 0xFF);
            case 0xA0:
                return prefix + ' PKP ' + (usage & 0xFF);
            case 0xB0:
                return prefix + ' CC' + (usage & 0xFF);
            case 0xC0:
                return prefix + ' program';
            case 0xD0:
                return prefix + ' CP';
            case 0xE0:
                return prefix + ' PB';
        }
    }
    return default_to_hex ? usage : '';
}

function readable_target_usage_name(usage) {
    return (usage in usages[config['our_descriptor_number']]) ? usages[config['our_descriptor_number']][usage]['name'] : usage;
}

function set_forced_layers(mapping, mapping_container) {
    for (let i = 0; i < NLAYERS; i++) {
        mapping_container.querySelector(".layer_checkbox" + i).disabled = false;
    }
    const usage_int = parseInt(mapping['target_usage'], 16);
    if (((usage_int & 0xFFFF0000) >>> 0) == LAYERS_USAGE_PAGE) {
        const layer = usage_int & 0xFFFF;
        const layer_checkbox = mapping_container.querySelector(".layer_checkbox" + layer);
        if (mapping['sticky']) {
            mapping['layers'] = mapping['layers'].filter((x) => x != layer);
            layer_checkbox.checked = false;
        } else {
            if (!mapping['layers'].includes(layer)) {
                mapping['layers'].push(layer)
                mapping['layers'].sort();
            }
            layer_checkbox.checked = true;
        }
        layer_checkbox.disabled = true;
    }
}

function set_forced_flags(mapping, mapping_container) {
    mapping_container.querySelector(".sticky_checkbox").disabled = false;
    mapping_container.querySelector(".tap_checkbox").disabled = false;
    mapping_container.querySelector(".hold_checkbox").disabled = false;
    const usage_int = parseInt(mapping['source_usage'], 16);
    if (((usage_int & 0xFFFF0000) >>> 0) == EXPR_USAGE_PAGE) {
        mapping_container.querySelector(".sticky_checkbox").checked = false;
        mapping_container.querySelector(".tap_checkbox").checked = false;
        mapping_container.querySelector(".hold_checkbox").checked = false;
        mapping_container.querySelector(".sticky_checkbox").disabled = true;
        mapping_container.querySelector(".tap_checkbox").disabled = true;
        mapping_container.querySelector(".hold_checkbox").disabled = true;
        mapping['sticky'] = false;
        mapping['tap'] = false;
        mapping['hold'] = false;
    }
}

function switch_to_mappings_tab() {
    bootstrap.Tab.getOrCreateInstance(document.getElementById("nav-mappings-tab")).show();
}

function expr_to_elems(expr) {
    const convert_elem = function (elem) {
        if (elem.toLowerCase().startsWith('0x')) {
            return [ops["PUSH_USAGE"], parseInt(elem, 16)];
        }
        if (/^[0-9-]/.test(elem)) {
            return [ops["PUSH"], parseInt(elem, 10)];
        }
        if (elem.toUpperCase() in ops) {
            return [ops[elem.toUpperCase()]];
        }
        throw new Error('Invalid expression: "' + elem + '"');
    }

    return [...expr.matchAll(expr_re).map(x => x[2])].join('').split(/\s+/).filter((x) => (x.length > 0)).map(convert_elem);
}

function validate_ui_expressions() {
    for (let i = 0; i < NEXPRESSIONS; i++) {
        expression_onchange(i)();
    }
}

function input_report_received(event) {
    if (event.reportId == REPORT_ID_MONITOR) {
        document.querySelectorAll('.monitor_row').forEach((element) => {
            element.classList.remove('bg-light');
        });
        for (let i = 0; i < 7; i++) {
            const usage = "0x" + event.data.getUint32(i * 9, true).toString(16).padStart(8, "0");
            const value = event.data.getInt32(i * 9 + 4, true);
            const hub_port = event.data.getUint8(i * 9 + 8);
            if (usage != 0) {
                update_monitor_ui(usage, value, hub_port);
                kb_hit(usage, value, hub_port);
            }
        }
    }
}

function update_monitor_ui(usage, value, hub_port) {
    const element_id = 'monitor_usage_' + usage + '_' + hub_port;
    let element = document.getElementById(element_id);
    if (element == null) {
        const template = document.getElementById("monitor_template");
        const container = document.getElementById("monitor_container");
        element = template.content.cloneNode(true).firstElementChild;
        element.querySelector('.monitor_usage .usage_label').innerText = usage;
        const port_badge = element.querySelector('.monitor_usage .hub_port_badge');
        port_badge.innerText = hub_port;
        if ((hub_port == 0) || (hub_port == HUB_PORT_NONE)) {
            port_badge.classList.add('d-none');
        } else {
            port_badge.classList.remove('d-none');
        }
        element.querySelector('.monitor_readable_name').innerText = readable_usage_name(usage, false);
        element.querySelector('.map_this_button').addEventListener("click", map_this_onclick(usage));
        element.id = element_id;
        container.appendChild(element);
    }

    document.getElementById('monitor_header').classList.remove('d-none');

    element.querySelector('.monitor_last_value').innerText = value;
    element.classList.add('bg-light');
    const key = usage + '_' + hub_port;
    if (!(key in monitor_min_val) || (value < monitor_min_val[key])) {
        monitor_min_val[key] = value;
        element.querySelector('.monitor_min_value').innerText = value;
    }
    if (!(key in monitor_max_val) || (value > monitor_max_val[key])) {
        monitor_max_val[key] = value;
        element.querySelector('.monitor_max_value').innerText = value;
    }
}

function monitor_clear() {
    clear_children(document.getElementById("monitor_container"));
    document.getElementById('monitor_header').classList.add('d-none');
    monitor_min_val = {};
    monitor_max_val = {};
}

async function set_monitor_enabled(enabled) {
    monitor_enabled = enabled;
    if (device != null) {
        await send_feature_command(SET_MONITOR_ENABLED, [[UINT8, monitor_enabled ? 1 : 0]]);
    }
}

async function monitor_tab_shown(event) {
    await set_monitor_enabled(true);
}

async function monitor_tab_hide(event) {
    // the keyboard picture's "light up keys" switch keeps the monitor on
    await set_monitor_enabled(document.getElementById('kb_live').checked);
}

function add_quirk(quirk) {
    const template = document.getElementById("quirk_template");
    const container = document.getElementById("quirks_container");
    const clone = template.content.cloneNode(true).firstElementChild;
    clone.querySelector(".delete_button").addEventListener("click", delete_quirk(quirk, clone));
    const vendor_id_input = clone.querySelector('.vendor_id_input');
    vendor_id_input.value = quirk['vendor_id'].replace(/^0[xX]/, '');
    vendor_id_input.addEventListener("change", quirk_hex_change('vendor_id', quirk, vendor_id_input));
    const product_id_input = clone.querySelector('.product_id_input');
    product_id_input.value = quirk['product_id'].replace(/^0[xX]/, '');
    product_id_input.addEventListener("change", quirk_hex_change('product_id', quirk, product_id_input));
    const interface_input = clone.querySelector('.interface_input');
    interface_input.value = quirk['interface'];
    interface_input.addEventListener("change", quirk_number_change('interface', quirk, interface_input));
    const report_id_input = clone.querySelector('.report_id_input');
    report_id_input.value = quirk['report_id'];
    report_id_input.addEventListener("change", quirk_number_change('report_id', quirk, report_id_input));
    const usage_input = clone.querySelector('.usage_input');
    usage_input.value = quirk['usage'].replace(/^0[xX]/, '');
    usage_input.addEventListener("change", quirk_hex_change('usage', quirk, usage_input));
    const size_input = clone.querySelector('.size_input');
    size_input.value = quirk['size'];
    size_input.addEventListener("change", quirk_number_change('size', quirk, size_input));
    const bitpos_input = clone.querySelector('.bitpos_input');
    bitpos_input.value = quirk['bitpos'];
    bitpos_input.addEventListener("change", quirk_number_change('bitpos', quirk, bitpos_input));
    const relative_checkbox = clone.querySelector(".relative_checkbox");
    relative_checkbox.checked = quirk['relative'];
    relative_checkbox.id = 'relative_checkbox' + unique_id_counter++;
    relative_checkbox.addEventListener("change", quick_checkbox_onclick('relative', quirk, relative_checkbox));
    clone.querySelector(".relative_checkbox_label").htmlFor = relative_checkbox.id;
    const signed_checkbox = clone.querySelector(".signed_checkbox");
    signed_checkbox.checked = quirk['signed'];
    signed_checkbox.id = 'signed_checkbox' + unique_id_counter++;
    signed_checkbox.addEventListener("change", quick_checkbox_onclick('signed', quirk, signed_checkbox));
    clone.querySelector(".signed_checkbox_label").htmlFor = signed_checkbox.id;
    container.appendChild(clone);
}

function quirk_hex_change(field_name, quirk, element) {
    return function () {
        if (/^[0-9a-fA-F]+$/.test(element.value)) {
            element.classList.remove('is-invalid');
            quirk[field_name] = '0x' + element.value;
        } else {
            element.classList.add('is-invalid');
            quirk[field_name] = '0x0000';
        }
    };
}

function quirk_number_change(field_name, quirk, element) {
    return function () {
        const value = parseInt(element.value, 10);
        if (isNaN(value)) {
            element.classList.add('is-invalid');
            quirk[field_name] = 0;
        } else {
            quirk[field_name] = value;
            element.classList.remove('is-invalid');
        }
    };
}

function quick_checkbox_onclick(field_name, quirk, element) {
    return function () {
        quirk[field_name] = element.checked;
    };
}

function add_empty_quirk() {
    let quirk = {
        "vendor_id": "0x0000",
        "product_id": "0x0000",
        "interface": 0,
        "report_id": 0,
        "usage": "0x00000000",
        "size": 0,
        "bitpos": 0,
        "relative": false,
        "signed": false
    };
    config['quirks'].push(quirk);
    add_quirk(quirk);
}

function delete_quirk(quirk, element) {
    return function () {
        config['quirks'] = config['quirks'].filter(x => x !== quirk);
        document.getElementById("quirks_container").removeChild(element);
    };
}

function set_quirks_ui_state() {
    clear_children(document.getElementById('quirks_container'));
    for (const quirk of config['quirks']) {
        add_quirk(quirk);
    }
}

function comparison_function(fields) {
    return (a, b) => {
        for (const field of fields) {
            if (a[field] < b[field]) {
                return -1;
            }
            if (a[field] > b[field]) {
                return 1;
            }
        }
        return 0;
    };
}

function sort_by(fields) {
    return (e) => {
        e.preventDefault();
        config['mappings'].sort(comparison_function(fields));
        set_mappings_ui_state();
    };
}

function usage_search_onchange(element) {
    return () => {
        const query = element.value.toLowerCase().replaceAll(" ", "");
        const modal_element = element.closest('.modal');
        let exact_match = null;
        let last_match = null;
        let hits = 0;
        modal_element.querySelectorAll('.usage_button').forEach((usage_button) => {
            const label = usage_button.innerText.toLowerCase().replaceAll(" ", "");
            usage_button.classList.toggle('d-none', !label.includes(query));
            usage_button.removeAttribute('data-preferred-result');
            if (label.includes(query)) {
                hits++;
                last_match = usage_button;
            }
            if (label == query) {
                exact_match = usage_button;
            }
        });
        let have_preferred_result = false;
        if (exact_match) {
            exact_match.setAttribute('data-preferred-result', "1");
            have_preferred_result = true;
        } else {
            if (hits == 1) {
                last_match.setAttribute('data-preferred-result', "1");
                have_preferred_result = true;
            }
        }
        element.closest('div').querySelector('.have_preferred_result_checkmark').classList.toggle('d-none', !have_preferred_result);
    }
}
// ---------------------------------------------------------------------------
// MicDrop: profiles stored on the board (firmware with settings version 19+).

let profiles = [];

function profile_name_fields(name) {
    const bytes = new TextEncoder().encode(name).slice(0, PROFILE_NAME_LEN);
    let fields = [];
    for (let i = 0; i < PROFILE_NAME_LEN; i++) {
        fields.push([UINT8, i < bytes.length ? bytes[i] : 0]);
    }
    return fields;
}

function device_type_name(n) {
    const option = document.querySelector('#our_descriptor_number_dropdown option[value="' + n + '"]');
    return option ? option.textContent : (n == 255 ? '' : 'Type ' + n);
}

async function profile_command(command, slot, name = '') {
    await send_feature_command(command, [[UINT8, slot]].concat(profile_name_fields(name)));
    const [result, active, restarting] = await read_config_feature([UINT8, UINT8, UINT8]);
    switch (result) {
        case 1:
            return { active, restarting: restarting != 0 };
        case 3:
            throw new Error('Profile ' + (slot + 1) + ' is empty.');
        case 4:
            throw new Error('Profile ' + (slot + 1) + ' is in use. Switch to another profile first.');
        case 5:
            throw new Error('Configuration too big to persist.');
        default:
            throw new Error('The board refused the profile command (' + result + ').');
    }
}

async function refresh_profiles() {
    const supported = (device != null) && device_has_profiles();
    document.getElementById('profiles_unsupported').classList.toggle('d-none', (device == null) || supported);
    document.getElementById('profiles_not_connected').classList.toggle('d-none', device != null);
    document.getElementById('profiles_table').classList.toggle('d-none', !supported);
    document.getElementById('profiles_save_as_row').classList.toggle('d-none', !supported);
    if (!supported) {
        render_side_profiles();
        return;
    }
    profiles = [];
    let nprofiles = NPROFILES;  // the board says how many it has (with profile 1)
    for (let slot = 0; slot < nprofiles; slot++) {
        await send_feature_command(PROFILE_GET, [[UINT8, slot]]);
        const fields = await read_config_feature([UINT8, UINT8, UINT8, UINT8, UINT16].concat(Array(PROFILE_NAME_LEN).fill(UINT8)));
        if ((slot == 0) && (fields[3] > 0)) {
            nprofiles = Math.min(fields[3], NPROFILES);
        }
        const name_bytes = fields.slice(5).filter((b) => b != 0);
        profiles.push({
            slot,
            saved: (fields[1] & 1) != 0,
            active: (fields[1] & 2) != 0,
            is_default: (fields[1] & 4) != 0,
            type: fields[2],
            mappings: fields[4],
            name: new TextDecoder().decode(new Uint8Array(name_bytes)),
        });
    }
    render_profiles();
}

function render_profiles() {
    const tbody = document.getElementById('profiles_tbody');
    clear_children(tbody);
    const save_slot = document.getElementById('profile_save_slot');
    const previous_choice = save_slot.value;
    clear_children(save_slot);
    for (const p of profiles) {
        const row = document.getElementById('profile_row_template').content.cloneNode(true).firstElementChild;
        row.querySelector('.profile_number').innerText = p.slot + 1;
        row.querySelector('.profile_name').innerText = p.saved || p.active ? (p.name || 'Profile ' + (p.slot + 1)) : '(empty)';
        row.querySelector('.profile_name').classList.toggle('text-muted', !p.saved && !p.active);
        row.querySelector('.profile_in_use').classList.toggle('d-none', !p.active);
        row.querySelector('.profile_default').classList.toggle('d-none', !p.is_default);
        row.querySelector('.profile_type').innerText = p.saved ? device_type_name(p.type) : '';
        row.querySelector('.profile_mappings').innerText = p.saved ? p.mappings : '';
        const switch_button = row.querySelector('.profile_switch');
        switch_button.disabled = !p.saved || p.active;
        switch_button.addEventListener('click', () => profile_switch(p.slot));
        const rename_button = row.querySelector('.profile_rename');
        rename_button.disabled = !p.saved && !p.active;
        rename_button.addEventListener('click', () => profile_rename(p.slot));
        const default_button = row.querySelector('.profile_make_default');
        default_button.disabled = !p.saved || p.is_default;
        default_button.addEventListener('click', () => profile_make_default(p.slot));
        const delete_button = row.querySelector('.profile_delete');
        delete_button.disabled = !p.saved || p.active;
        delete_button.addEventListener('click', () => profile_delete(p.slot));
        tbody.appendChild(row);

        const option = document.createElement('option');
        option.value = p.slot;
        option.innerText = 'Profile ' + (p.slot + 1) + (p.saved ? ' (replace "' + (p.name || 'Profile ' + (p.slot + 1)) + '")' : ' (empty)');
        save_slot.appendChild(option);
    }
    render_side_profiles();
    const first_empty = profiles.find((p) => !p.saved && !p.active);
    save_slot.value = previous_choice !== '' && profiles[previous_choice] ? previous_choice : (first_empty ? first_empty.slot : 0);
}

async function profile_action(action) {
    if ((device == null) || busy) {
        return;
    }
    busy = true;
    clear_error();
    try {
        await action();
    } catch (e) {
        display_error(e);
    }
    busy = false;
}

function profile_restart_message(slot) {
    display_info('Switched to profile ' + (slot + 1) + '. It uses a different device type, so the board is restarting. Wait a few seconds, then click Open device again.');
    running_device_type = null;
}

function profile_switch(slot) {
    return profile_action(async () => {
        const r = await profile_command(PROFILE_SWITCH, slot);
        if (r.restarting) {
            profile_restart_message(slot);
            return;
        }
        busy = false;
        await load_from_device();
        busy = true;
        await refresh_profiles();
        display_info('Now using profile ' + (slot + 1) + '. Its settings are shown below; Save to device saves into this profile.');
    });
}

function profile_save_as() {
    return profile_action(async () => {
        const slot = parseInt(document.getElementById('profile_save_slot').value);
        const name = document.getElementById('profile_save_name').value.trim();
        const target = profiles[slot];
        if (target && target.saved && !confirm('Replace profile ' + (slot + 1) + ' ("' + (target.name || 'Profile ' + (slot + 1)) + '") with the settings on this page?')) {
            return;
        }
        await send_config_to_device();
        const r = await profile_command(PROFILE_SAVE_AS, slot, name);
        await send_feature_command(RESUME);
        if (r.restarting) {
            display_info('Saved as profile ' + (slot + 1) + '. It uses a different device type, so the board is restarting. Wait a few seconds, then click Open device again.');
            running_device_type = null;
            return;
        }
        document.getElementById('profile_save_name').value = '';
        await refresh_profiles();
        display_info('Saved as profile ' + (slot + 1) + ', which is now in use.');
    });
}

function profile_rename(slot) {
    return profile_action(async () => {
        const current = profiles[slot] ? profiles[slot].name : '';
        const name = prompt('Name for profile ' + (slot + 1) + ' (up to ' + PROFILE_NAME_LEN + ' characters):', current);
        if (name === null) {
            return;
        }
        await profile_command(PROFILE_RENAME, slot, name.trim());
        await refresh_profiles();
    });
}

function profile_make_default(slot) {
    return profile_action(async () => {
        await profile_command(PROFILE_SET_DEFAULT, slot);
        await refresh_profiles();
    });
}

function profile_delete(slot) {
    return profile_action(async () => {
        const p = profiles[slot];
        if (!confirm('Delete profile ' + (slot + 1) + ' ("' + (p.name || 'Profile ' + (slot + 1)) + '") from the board?')) {
            return;
        }
        await profile_command(PROFILE_DELETE, slot);
        await refresh_profiles();
    });
}

// ---------------------------------------------------------------------------
// MicDrop app layout: keyboard picture, inspector, profiles sidebar.
// Everything edits config['mappings'] like the mapping rows do, then redraws.

// Devices that can be drawn. Each key: [label, usage, x, y, w, h, round]. A usage
// below 0x100 is a keyboard key (page 7); null draws a key that can't be mapped.
// x/y/w/h are in key units.

function kb_rows(rows, x0 = 0, y0 = 0, row_step = 1) {
    const keys = [];
    rows.forEach((row, r) => {
        let x = x0;
        for (const [label, usage, w = 1] of row) {
            if (label !== '') {
                keys.push([label, usage, x, y0 + r * row_step, w, 1]);
            }
            x += w;
        }
    });
    return keys;
}
const SP = (w) => ['', null, w];

const ROW_NUM = [['`', 0x35], ['1', 0x1e], ['2', 0x1f], ['3', 0x20], ['4', 0x21], ['5', 0x22], ['6', 0x23], ['7', 0x24], ['8', 0x25], ['9', 0x26], ['0', 0x27], ['-', 0x2d], ['=', 0x2e], ['Bksp', 0x2a, 2]];
const ROW_Q = [['Tab', 0x2b, 1.5], ['Q', 0x14], ['W', 0x1a], ['E', 0x08], ['R', 0x15], ['T', 0x17], ['Y', 0x1c], ['U', 0x18], ['I', 0x0c], ['O', 0x12], ['P', 0x13], ['[', 0x2f], [']', 0x30], ['\\', 0x31, 1.5]];
const ROW_A = [['Caps', 0x39, 1.75], ['A', 0x04], ['S', 0x16], ['D', 0x07], ['F', 0x09], ['G', 0x0a], ['H', 0x0b], ['J', 0x0d], ['K', 0x0e], ['L', 0x0f], [';', 0x33], ["'", 0x34], ['Enter', 0x28, 2.25]];
const ROW_Z = [['Shift', 0xe1, 2.25], ['Z', 0x1d], ['X', 0x1b], ['C', 0x06], ['V', 0x19], ['B', 0x05], ['N', 0x11], ['M', 0x10], [',', 0x36], ['.', 0x37], ['/', 0x38]];
const F_KEYS = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => ['F' + (from + i), 0x3a + from + i - 1]);

function mouse_keys(extra = []) {
    return [
        ['Left', 0x00090001, 0.7, 0.3, 2.2, 3.2],
        ['Right', 0x00090002, 3.1, 0.3, 2.2, 3.2],
        ['⇕', 0x00010038, 2.65, 0.7, 0.7, 1.6, true],
        ['Mid', 0x00090003, 2.55, 2.45, 0.9, 0.7],
        ['Fwd', 0x00090005, 0, 3.9, 0.75, 1.1],
        ['Back', 0x00090004, 0, 5.15, 0.75, 1.1],
    ].concat(extra);
}

const DEVICES = {
    full: {
        code: 1, name: 'Full-size keyboard', unit: 33, w: 22.5, h: 6.5,
        keys: [].concat(
            [['Esc', 0x29, 0, 0]], kb_rows([F_KEYS(1, 4)], 2, 0), kb_rows([F_KEYS(5, 8)], 6.5, 0), kb_rows([F_KEYS(9, 12)], 11, 0),
            kb_rows([ROW_NUM, ROW_Q, ROW_A, ROW_Z.concat([['Shift', 0xe5, 2.75]]),
                [['Ctrl', 0xe0, 1.25], ['Win', 0xe3, 1.25], ['Alt', 0xe2, 1.25], ['Space', 0x2c, 6.25], ['AltGr', 0xe6, 1.25], ['Win', 0xe7, 1.25], ['Menu', 0x65, 1.25], ['Ctrl', 0xe4, 1.25]]], 0, 1.5),
            kb_rows([[['PrtSc', 0x46], ['ScrLk', 0x47], ['Pause', 0x48]]], 15.25, 0),
            kb_rows([[['Ins', 0x49], ['Home', 0x4a], ['PgUp', 0x4b]], [['Del', 0x4c], ['End', 0x4d], ['PgDn', 0x4e]]], 15.25, 1.5),
            [['↑', 0x52, 16.25, 4.5], ['←', 0x50, 15.25, 5.5], ['↓', 0x51, 16.25, 5.5], ['→', 0x4f, 17.25, 5.5]],
            kb_rows([[['Num', 0x53], ['/', 0x54], ['*', 0x55], ['-', 0x56]], [['7', 0x5f], ['8', 0x60], ['9', 0x61]], [['4', 0x5c], ['5', 0x5d], ['6', 0x5e]], [['1', 0x59], ['2', 0x5a], ['3', 0x5b]]], 18.5, 1.5),
            [['+', 0x57, 21.5, 2.5, 1, 2], ['Enter', 0x58, 21.5, 4.5, 1, 2], ['0', 0x62, 18.5, 5.5, 2, 1], ['.', 0x63, 20.5, 5.5]]
        ),
    },
    k75: {
        code: 10, name: '75% keyboard', unit: 38, w: 15, h: 6,
        keys: kb_rows([
            [['Esc', 0x29]].concat(F_KEYS(1, 12), [['PgUp', 0x4b], ['PgDn', 0x4e]]),
            ROW_NUM, ROW_Q, ROW_A, ROW_Z.concat([['Shift', 0xe5, 1.75], ['Del', 0x4c]]),
            [['Ctrl', 0xe0, 1.25], ['Win', 0xe3, 1.25], ['Alt', 0xe2, 1.25], ['Space', 0x2c, 5.25], ['AltGr', 0xe6], ['Menu', 0x65], ['←', 0x50], ['↑', 0x52], ['↓', 0x51], ['→', 0x4f]],
        ]),
    },
    k68: {
        code: 2, name: '68-key keyboard (65%)', unit: 38, w: 16, h: 5,
        keys: kb_rows([
            [['Esc', 0x29]].concat(ROW_NUM.slice(1), [['Del', 0x4c]]),
            ROW_Q.concat([['PgUp', 0x4b]]),
            ROW_A.concat([['PgDn', 0x4e]]),
            ROW_Z.concat([['Shift', 0xe5, 1.75], ['↑', 0x52], ['End', 0x4d]]),
            [['Ctrl', 0xe0, 1.25], ['Win', 0xe3, 1.25], ['Alt', 0xe2, 1.25], ['Space', 0x2c, 6.25], ['Alt', 0xe6], ['Fn', null], ['Ctrl', 0xe4], ['←', 0x50], ['↓', 0x51], ['→', 0x4f]],
        ]),
        note: 'Fn is handled inside the keyboard, so it can\'t be mapped. Esc may send ` on some 68-key boards.',
    },
    km16: {
        shape: 'km16',
        code: 6, name: 'MMD KM16 Pro', unit: 52, w: 4.3, h: 5.9,
        // three knobs: press in the middle, turn left / right underneath
        keys: [
            ['W', 0x1a, 0.3, 0, 0.8, 0.8, true], ['‹A', 0x04, 0, 0.85, 0.7, 0.5], ['D›', 0x07, 0.72, 0.85, 0.7, 0.5],
            ['Layer', null, 1.75, 0, 0.8, 0.8, true], ['‹;', 0x33, 1.45, 0.85, 0.7, 0.5], ["'›", 0x34, 2.17, 0.85, 0.7, 0.5],
            ['F9', 0x42, 3.2, 0, 0.8, 0.8, true], ['‹−', 0x000c00ea, 2.9, 0.85, 0.7, 0.5], ['+›', 0x000c00e9, 3.62, 0.85, 0.7, 0.5],
        ].concat(kb_rows([
            [['F4', 0x3d], ['F1', 0x3a], ['F2', 0x3b], ['F3', 0x3c]],
            [['1', 0x1e], ['2', 0x1f], ['3', 0x20], ['4', 0x21]],
            [['R', 0x15], ['Q', 0x14], ['E', 0x08], ['W', 0x1a]],
            [['N', 0x11], ['Z', 0x1d], ['←', 0x50], ['→', 0x4f]],
        ], 0.15, 1.6, 1.05)),
        note: 'Keys and knobs as your VIA layout sets them (knob turns send A/D, ;/\' and Volume−/+, knob presses W, layer, F9). Change the layout in VIA and these labels won\'t match.',
    },
    mouse: { code: 7, name: 'Regular mouse', unit: 34, w: 6, h: 9, shape: 'mouse', keys: mouse_keys() },
    g502: {
        code: 3, name: 'Logitech G502', unit: 34, w: 6, h: 9, shape: 'mouse',
        keys: mouse_keys([
            ['Tilt', 0x000c0238, 2.55, 3.3, 0.9, 0.6],
            ['G7', 0x00090006, 0.85, 3.65, 0.8, 0.6], ['G8', 0x00090007, 0.85, 4.35, 0.8, 0.6],
            ['G9', 0x00090008, 0, 6.5, 0.75, 1],
        ]),
        note: 'G7, G8 and G9 only reach the board if G HUB sets them to mouse buttons 6, 7 and 8 (by default they change DPI inside the mouse). Wheel tilt is horizontal scrolling.',
    },
    g303: { code: 4, name: 'Logitech G303', unit: 34, w: 6, h: 9, shape: 'mouse', keys: mouse_keys(), note: 'The DPI button works inside the mouse, so it can\'t be mapped.' },
    em06: {
        code: 5, name: 'ProtoArc EM06', unit: 34, w: 6, h: 9, shape: 'trackball', keys: mouse_keys(),
        note: 'Its receiver also has a keyboard part: buttons set to send keys show up in the list below the picture.',
    },
    magscroll: {
        code: 8, name: 'MagScroll', unit: 50, w: 4, h: 3.4, shape: 'knob',
        keys: [['Turn to scroll', 0x00010038, 0.5, 0.2, 3, 3, true]],
        note: 'The knob scrolls like a mouse wheel. Set it up on the MagScroll page.',
    },
    shuttle: {
        code: 9, name: 'Contour ShuttleXpress', unit: 46, w: 4.8, h: 4.3, shape: 'shuttle',
        keys: [
            ['1', 0x00090005, 0.1, 1.5, 0.8, 0.7], ['2', 0x00090006, 0.75, 0.5, 0.8, 0.7], ['3', 0x00090007, 2, 0.1, 0.8, 0.7],
            ['4', 0x00090008, 3.25, 0.5, 0.8, 0.7], ['5', 0x00090009, 3.9, 1.5, 0.8, 0.7],
            ['Shuttle ring', 0x00010038, 1.1, 1.3, 2.6, 2.6, true, 'ring'], ['Jog', 0x00010037, 1.75, 1.95, 1.3, 1.3, true],
        ],
        note: 'Needs a board that handles low-speed USB: the Feather works, the Waveshare RP2350 doesn\'t.',
    },
};
const DEVICE_ORDER = ['full', 'k75', 'k68', 'km16', 'mouse', 'g502', 'g303', 'em06', 'magscroll', 'shuttle'];
const DEVICE_BY_CODE = Object.fromEntries(Object.entries(DEVICES).map(([id, d]) => [d.code, id]));

// Which device sits on which hub port is kept per profile, on the board, as
// placeholder mappings in usage page 0xFFFB (source 0xFFFB0000 | port << 8 |
// device code, output Nothing) that the firmware never matches. The page hides them.
const PORT_DEVICE_USAGE_PAGE = 0xFFFB0000;

function key_usage(usage) {
    return '0x' + ((usage < 0x100 ? 0x00070000 + usage : usage) >>> 0).toString(16).padStart(8, '0');
}

function port_name(port) {
    return port == 0 ? 'Any port' : 'Port ' + port;
}

function port_devices() {
    if (!config['port_devices'] || typeof config['port_devices'] !== 'object') {
        config['port_devices'] = {};
    }
    return config['port_devices'];
}

// moves placeholder mappings (from the board or an old JSON file) into config['port_devices']
function extract_port_devices() {
    const devices = port_devices();
    config['mappings'] = config['mappings'].filter((m) => {
        const usage = parseInt(m['source_usage'], 16) >>> 0;
        if (((usage & 0xFFFF0000) >>> 0) != PORT_DEVICE_USAGE_PAGE) {
            return true;
        }
        const id = DEVICE_BY_CODE[usage & 0xFF];
        if (id) {
            devices[String((usage >> 8) & 0xFF)] = id;
        }
        return false;
    });
}

function port_device_mappings() {
    return Object.entries(port_devices()).filter(([, id]) => id in DEVICES).map(([port, id]) => ({
        'source_usage': '0x' + ((PORT_DEVICE_USAGE_PAGE | (parseInt(port) << 8) | DEVICES[id].code) >>> 0).toString(16).padStart(8, '0'),
        'target_usage': '0x00000000',
        'layers': [0],
        'sticky': false,
        'tap': false,
        'hold': false,
        'scaling': DEFAULT_SCALING,
        'source_port': 0,
        'target_port': 0,
    }));
}

let current_port = '0';

function current_device_id() {
    const devices = port_devices();
    return devices[current_port] || (current_port == '0' ? 'full' : 'full');
}

function render_port_bar() {
    const bar = document.getElementById('dev_ports');
    clear_children(bar);
    const devices = port_devices();
    const ports = Object.keys(devices);
    if (!ports.includes(current_port)) {
        ports.push(current_port);  // a port with mappings but no device chosen yet
    }
    ports.sort((a, b) => a - b);
    for (const port of ports) {
        const id = devices[port] || 'full';
        const chip = md_element('button', { type: 'button', class: 'md-port' + (port == current_port ? ' on' : ''), 'aria-pressed': port == current_port ? 'true' : 'false' });
        chip.appendChild(md_element('span', { class: 'p' }, port_name(port)));
        chip.appendChild(md_element('span', { class: 'd' }, (port in devices) ? DEVICES[id].name : 'choose a device'));
        chip.addEventListener('click', () => { current_port = port; md_refresh(); });
        bar.appendChild(chip);
    }
    const add = md_element('button', { type: 'button', class: 'md-port md-port-add' }, '+ Add a device');
    add.addEventListener('click', () => {
        document.getElementById('dev_add_form').classList.toggle('d-none');
    });
    bar.appendChild(add);

    // the selected port's device and remove button
    const pick = document.getElementById('dev_kind');
    if (pick.options.length == 0) {
        for (const id of DEVICE_ORDER) {
            pick.appendChild(md_element('option', { value: id }, DEVICES[id].name));
        }
        const add_kind = document.getElementById('dev_add_kind');
        for (const id of DEVICE_ORDER) {
            add_kind.appendChild(md_element('option', { value: id }, DEVICES[id].name));
        }
    }
    pick.value = current_device_id();
    document.getElementById('dev_kind_label').innerText = port_name(current_port) + ' is';
    document.getElementById('dev_remove').disabled = !(current_port in devices);
    const add_port = document.getElementById('dev_add_port');
    clear_children(add_port);
    for (let p = 0; p <= 15; p++) {
        if (!(String(p) in devices)) {
            add_port.appendChild(md_element('option', { value: String(p) }, port_name(p)));
        }
    }
}

function dev_setup() {
    document.getElementById('dev_kind').addEventListener('change', (e) => {
        port_devices()[current_port] = e.target.value;
        md_refresh();
    });
    document.getElementById('dev_remove').addEventListener('click', () => {
        delete port_devices()[current_port];
        current_port = '0';
        md_refresh();
    });
    document.getElementById('dev_add').addEventListener('click', () => {
        const port = document.getElementById('dev_add_port').value;
        if (port === '') {
            return;
        }
        port_devices()[port] = document.getElementById('dev_add_kind').value;
        current_port = port;
        document.getElementById('dev_add_form').classList.add('d-none');
        md_refresh();
    });
}

function render_device_picture() {
    const id = current_device_id();
    const device = DEVICES[id];
    const pic = document.getElementById('kb_picture');
    if (pic.dataset.device !== id) {
        pic.dataset.device = id;
        clear_children(pic);
        const u = device.unit;
        pic.style.width = (device.w * u) + 'px';
        pic.style.height = (device.h * u) + 'px';
        pic.className = 'md-dev md-dev-' + (device.shape || 'keyboard');
        pic.setAttribute('aria-label', device.name);
        if (device.shape == 'mouse' || device.shape == 'trackball') {
            pic.appendChild(md_element('div', { class: 'md-dev-body', 'aria-hidden': 'true' }));
            if (device.shape == 'trackball') {
                pic.appendChild(md_element('div', { class: 'md-dev-ball', 'aria-hidden': 'true' }));
            }
        }
        for (const [label, usage, x, y, w = 1, h = 1, round = false, extra = ''] of device.keys) {
            const key = md_element('button', { type: 'button', class: 'md-key' + (round ? ' round' : '') + (usage === null ? ' fixed' : '') + (extra ? ' ' + extra : '') });
            key.style.left = (x * u + 2) + 'px';
            key.style.top = (y * u + 2) + 'px';
            key.style.width = (w * u - 4) + 'px';
            key.style.height = (h * u - 4) + 'px';
            key.appendChild(md_element('span', {}, label));
            if (usage === null) {
                key.disabled = true;
                key.title = label + ': handled inside the device, can\'t be mapped';
            } else {
                key.dataset.usage = key_usage(usage);
                key.setAttribute('aria-label', readable_usage_name(key_usage(usage)) + ' (' + label + ')');
                key.addEventListener('click', () => kb_key_clicked(key_usage(usage)));
            }
            pic.appendChild(key);
        }
        const note = document.getElementById('dev_note');
        note.innerText = device.note || '';
        note.classList.toggle('d-none', !device.note);
    }
}

function kb_key_clicked(usage) {
    const port = parseInt(current_port);
    let mapping = config['mappings'].find((m) => (m['source_usage'] == usage) && ((m['source_port'] || 0) == port));
    if (!mapping) {
        add_empty_mapping(usage);
        mapping = config['mappings'][config['mappings'].length - 1];
        mapping['source_port'] = port;
        set_mappings_ui_state();
    }
    md_select(mapping, true);
}

// called for each input the board reports while the monitor is on
function kb_hit(usage, value, hub_port = 0) {
    if ((current_port != '0') && (String(hub_port) != current_port)) {
        return;
    }
    const pressed = value != 0;
    document.querySelectorAll('#kb_picture .md-key[data-usage="' + usage + '"], #kb_other .md-chip[data-usage="' + usage + '"]').forEach((element) => {
        element.classList.toggle('hit', pressed);
        if (pressed) {
            clearTimeout(element._hit_timer);
            // wheels and knobs only report movement, so let their light fade
            element._hit_timer = setTimeout(() => element.classList.remove('hit'), 400);
        }
    });
}

function md_refresh() {
    if (selected_mapping && !config['mappings'].includes(selected_mapping)) {
        selected_mapping = null;
    }
    render_port_bar();
    render_device_picture();
    const port = parseInt(current_port);
    const first_index = {};
    config['mappings'].forEach((m, i) => {
        if (((m['source_port'] || 0) == port) && !(m['source_usage'] in first_index)) {
            first_index[m['source_usage']] = i;
        }
    });
    const on_picture = new Set();
    document.querySelectorAll('#kb_picture .md-key[data-usage]').forEach((key) => {
        const usage = key.dataset.usage;
        on_picture.add(usage);
        const i = first_index[usage];
        const mapped = i !== undefined;
        key.classList.toggle('m', mapped);
        key.classList.toggle('sel', !!selected_mapping && selected_mapping['source_usage'] == usage && (selected_mapping['source_port'] || 0) == port);
        let badge = key.querySelector('.md-badge');
        if (mapped) {
            if (!badge) {
                badge = md_element('span', { class: 'md-badge' });
                key.appendChild(badge);
            }
            badge.innerText = i + 1;
            key.title = readable_usage_name(usage) + ' → ' + readable_target_usage_name(config['mappings'][i]['target_usage']);
        } else {
            if (badge) {
                badge.remove();
            }
            key.title = readable_usage_name(usage) + ' (not mapped)';
        }
    });
    // this port's mappings whose input isn't on the picture
    const other = document.getElementById('kb_other');
    clear_children(other);
    config['mappings'].forEach((m, i) => {
        if (((m['source_port'] || 0) != port) || on_picture.has(m['source_usage']) || (m['source_usage'] == '0x00000000')) {
            return;
        }
        const chip = md_element('button', { type: 'button', class: 'md-chip' + (m === selected_mapping ? ' sel' : '') });
        chip.dataset.usage = m['source_usage'];
        chip.appendChild(md_element('b', {}, String(i + 1)));
        chip.appendChild(document.createTextNode('source_name' in m ? m['source_name'] : readable_usage_name(m['source_usage'])));
        chip.addEventListener('click', () => md_select(m, true));
        other.appendChild(chip);
    });
    // rows
    const rows = document.querySelectorAll('#mappings .mapping_container');
    rows.forEach((row, i) => {
        const m = config['mappings'][i];
        row.classList.toggle('md-selected', !!m && m === selected_mapping);
        if (!row.dataset.mdBound) {
            row.dataset.mdBound = '1';
            row.addEventListener('click', (event) => {
                if (event.target.closest('.delete_button')) {
                    return;
                }
                const index = Array.from(document.querySelectorAll('#mappings .mapping_container')).indexOf(row);
                const mapping = config['mappings'][index];
                if (mapping) {
                    selected_mapping = mapping;
                    // show the picture of the port this mapping listens to
                    current_port = String(mapping['source_port'] || 0);
                    md_refresh_soon();
                }
            });
        }
    });
    render_inspector();
}

const POWERMIC_PICKS = {
    8: ['0xff010003', '0xff010007', '0xff010005', '0xff010006', '0xff010002', '0xff010004', '0xff010008', '0xff01000a', '0xff010009', '0xff010001'],
    7: ['0xff020001', '0xff020002', '0xff020003'],
};
POWERMIC_PICKS[6] = POWERMIC_PICKS[8];

let selected_mapping = null;
let md_refresh_pending = false;

function mapping_index(mapping) {
    return config['mappings'].indexOf(mapping);
}

function mapping_row(mapping) {
    const i = mapping_index(mapping);
    return i < 0 ? null : document.querySelectorAll('#mappings .mapping_container')[i] || null;
}

function md_refresh_soon() {
    if (md_refresh_pending) {
        return;
    }
    md_refresh_pending = true;
    setTimeout(() => { md_refresh_pending = false; md_refresh(); }, 0);
}

function md_select(mapping, scroll = false) {
    selected_mapping = mapping;
    md_refresh();
    const row = mapping_row(mapping);
    if (scroll && row) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function md_setup() {
    dev_setup();
    document.getElementById('kb_live').addEventListener('change', kb_live_onchange);
    document.getElementById('side_manage_profiles').addEventListener('click', () => {
        const tab = document.getElementById('nav-profiles-tab');
        if (window.bootstrap && bootstrap.Tab && bootstrap.Tab.getOrCreateInstance) {
            bootstrap.Tab.getOrCreateInstance(tab).show();
        } else {
            tab.click();
        }
        tab.scrollIntoView({ block: 'nearest' });
    });
    // anything that edits mappings (rows, the pickers, settings) redraws the picture and inspector
    for (const id of ['mappings', 'source_usage_modal', 'target_usage_modal', 'nav-settings']) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', md_refresh_soon);
            element.addEventListener('change', md_refresh_soon);
            element.addEventListener('input', md_refresh_soon);
        }
    }
    document.getElementById('add_mapping').addEventListener('click', () => {
        const mappings = config['mappings'];
        md_select(mappings[mappings.length - 1], true);
    });
    // below 1200 px there is one column: keep the inspector right under the picture
    const narrow = window.matchMedia('(max-width: 1199px)');
    const place_inspector = () => {
        const insp = document.getElementById('inspector');
        if (narrow.matches) {
            document.getElementById('kb_card').after(insp);
        } else {
            document.querySelector('.md-app').appendChild(insp);
        }
    };
    narrow.addEventListener('change', place_inspector);
    place_inspector();
    render_side_profiles();
    md_refresh();
}


async function kb_live_onchange() {
    const on = document.getElementById('kb_live').checked;
    try {
        await set_monitor_enabled(on);  // remembered if no board is open yet
    } catch (e) {
        display_error(e);
    }
}



function md_element(tag, attrs = {}, text = null) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') {
            e.className = v;
        } else {
            e.setAttribute(k, v);
        }
    }
    if (text !== null) {
        e.innerText = text;
    }
    return e;
}

function md_mapping_changed() {
    set_mappings_ui_state();
    md_refresh();
}

function render_inspector() {
    const insp = document.getElementById('inspector');
    if (!insp) {
        return;
    }
    clear_children(insp);
    const m = selected_mapping;
    if (!m) {
        const empty = md_element('div', { class: 'md-insp-empty' });
        empty.innerHTML = '<strong>No mapping selected.</strong><br>Click a key on the picture, or a row in the list, to edit what it sends.';
        insp.appendChild(empty);
        return;
    }
    const index = mapping_index(m);
    const head = md_element('div', { class: 'md-insp-head' });
    head.appendChild(md_element('span', { class: 'md-insp-num', 'aria-hidden': 'true' }, String(index + 1)));
    const titles = md_element('div');
    titles.appendChild(md_element('h2', { class: 'md-insp-title' }, 'source_name' in m ? m['source_name'] : readable_usage_name(m['source_usage'])));
    titles.appendChild(md_element('div', { class: 'md-insp-sub' }, 'Mapping ' + (index + 1) + ' · input ' + m['source_usage']));
    head.appendChild(titles);
    insp.appendChild(head);

    const body = md_element('div', { class: 'md-insp-body' });

    // input
    const input_set = md_element('fieldset');
    input_set.appendChild(md_element('legend', {}, 'Input'));
    const input_row = md_element('div', { class: 'md-insp-current' });
    input_row.appendChild(md_element('span', { class: 'v' }, 'source_name' in m ? m['source_name'] : readable_usage_name(m['source_usage'])));
    const change_input = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, 'Change');
    change_input.addEventListener('click', () => {
        const row = mapping_row(m);
        if (row) {
            row.querySelector('.source_button').click();
        }
    });
    input_row.appendChild(change_input);
    input_set.appendChild(input_row);
    body.appendChild(input_set);

    // output
    const output_set = md_element('fieldset');
    output_set.appendChild(md_element('legend', {}, 'Sends'));
    const output_row = md_element('div', { class: 'md-insp-current' });
    output_row.appendChild(md_element('span', { class: 'v' }, readable_target_usage_name(m['target_usage'])));
    const choose_output = md_element('button', { type: 'button', class: 'btn btn-sm btn-primary' }, 'Choose…');
    choose_output.addEventListener('click', () => {
        const row = mapping_row(m);
        if (row) {
            row.querySelector('.target_button').click();
        }
    });
    output_row.appendChild(choose_output);
    output_set.appendChild(output_row);
    const type = parseInt(config['our_descriptor_number']);
    let picks = POWERMIC_PICKS[type] || null;
    if (type == 9) {
        picks = Object.keys(usages[9]).filter((u) => u.startsWith('0xff03'));
    }
    if (picks) {
        const grid = md_element('div', { class: 'md-pick', role: 'group', 'aria-label': 'Quick picks' });
        for (const usage of picks) {
            if (!(usage in usages[type])) {
                continue;
            }
            const name = usages[type][usage]['name'].replace(/^PowerMic (4 )?/, '').replace(/^Foot pedal /, '');
            const on = m['target_usage'] == usage;
            const button = md_element('button', { type: 'button', class: 'btn' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false' }, name);
            button.addEventListener('click', () => {
                m['target_usage'] = usage;
                md_mapping_changed();
            });
            grid.appendChild(button);
        }
        output_set.appendChild(grid);
    }
    body.appendChild(output_set);

    // layers
    const layer_set = md_element('fieldset');
    layer_set.appendChild(md_element('legend', {}, 'Layers'));
    const layers = md_element('div', { class: 'md-layers' });
    for (let i = 0; i < NLAYERS; i++) {
        const id = 'insp_layer_' + i;
        const wrap = md_element('div', { class: 'form-check form-check-inline me-0' });
        const box = md_element('input', { type: 'checkbox', class: 'form-check-input', id });
        box.checked = m['layers'].includes(i);
        box.addEventListener('change', () => {
            m['layers'] = m['layers'].filter((x) => x != i);
            if (box.checked) {
                m['layers'].push(i);
                m['layers'].sort();
            }
            md_mapping_changed();
        });
        wrap.appendChild(box);
        wrap.appendChild(md_element('label', { class: 'form-check-label', for: id }, i == 0 ? 'Base' : String(i)));
        layers.appendChild(wrap);
    }
    layer_set.appendChild(layers);
    body.appendChild(layer_set);

    // behaviour
    const how_set = md_element('fieldset');
    how_set.appendChild(md_element('legend', {}, 'Behaviour'));
    for (const [key, label] of [['sticky', 'Latched (press on, press off)'], ['tap', 'Only on tap'], ['hold', 'Only on hold']]) {
        const id = 'insp_' + key;
        const wrap = md_element('div', { class: 'form-check' });
        const box = md_element('input', { type: 'checkbox', class: 'form-check-input', id });
        box.checked = !!m[key];
        box.addEventListener('change', () => {
            m[key] = box.checked;
            md_mapping_changed();
        });
        wrap.appendChild(box);
        wrap.appendChild(md_element('label', { class: 'form-check-label', for: id }, label));
        how_set.appendChild(wrap);
    }
    body.appendChild(how_set);

    // port
    const port_set = md_element('fieldset');
    port_set.appendChild(md_element('legend', {}, 'From device'));
    const port_label = md_element('label', { for: 'insp_port', class: 'visually-hidden' }, 'Hub port');
    port_set.appendChild(port_label);
    const port = md_element('select', { id: 'insp_port', class: 'form-select' });
    const named = port_devices();
    for (let p = 0; p <= 15; p++) {
        const id = named[String(p)];
        port.appendChild(md_element('option', { value: String(p) }, port_name(p) + (id ? ' \u00b7 ' + DEVICES[id].name : '')));
    }
    port.value = String(m['source_port'] || 0);
    port.addEventListener('change', () => {
        m['source_port'] = parseInt(port.value, 10);
        current_port = String(m['source_port']);
        md_mapping_changed();
    });
    port_set.appendChild(port);
    const key_usage = parseInt(m['source_usage'], 16);
    if ((key_usage >= 0x000700e0) && (key_usage <= 0x000700e7) && (m['source_port'] || 0) != 0) {
        port_set.appendChild(md_element('p', { class: 'small text-muted mt-2 mb-0' }, 'Modifier keys (Ctrl, Shift, Alt, Win) are only reliable on "Any port".'));
    }
    body.appendChild(port_set);
    insp.appendChild(body);

    const foot = md_element('div', { class: 'md-insp-foot' });
    const remove = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-danger' }, 'Delete mapping');
    remove.addEventListener('click', () => {
        const row = mapping_row(m);
        if (row) {
            row.querySelector('.delete_button').click();
        }
        selected_mapping = null;
        md_refresh_soon();
    });
    foot.appendChild(remove);
    foot.appendChild(md_element('span', { class: 'small text-muted align-self-center' }, 'Save to device to keep changes.'));
    insp.appendChild(foot);
}

function render_side_profiles() {
    const list = document.getElementById('side_profiles');
    const note = document.getElementById('side_profiles_note');
    if (!list) {
        return;
    }
    clear_children(list);
    if (device == null) {
        note.innerHTML = 'Click <strong>Open device</strong> to see the profiles on the board.';
        note.classList.remove('d-none');
        return;
    }
    if (!device_has_profiles()) {
        note.innerText = "This board's firmware doesn't have profiles yet. Flash the latest MicDrop firmware to use them.";
        note.classList.remove('d-none');
        return;
    }
    note.classList.add('d-none');
    for (const p of profiles) {
        if (!p.saved && !p.active) {
            continue;
        }
        const button = md_element('button', { type: 'button', class: 'md-prof' + (p.active ? ' on' : '') });
        button.appendChild(md_element('span', { class: 't' }, p.name || 'Profile ' + (p.slot + 1)));
        button.appendChild(md_element('span', { class: 's' }, (p.slot + 1) + ' · ' + (p.saved ? device_type_name(p.type) : 'not saved yet') + (p.is_default ? ' · default' : '')));
        if (p.active) {
            button.appendChild(md_element('span', { class: 'a' }, '● In use'));
            button.setAttribute('aria-current', 'true');
        } else {
            button.title = 'Switch to this profile';
            button.addEventListener('click', () => profile_switch(p.slot));
        }
        list.appendChild(button);
    }
}
