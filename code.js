import crc32 from './crc.js';
import usages from './usages.js';
import examples from './examples.js';

const REPORT_ID_CONFIG = 100;
const REPORT_ID_MONITOR = 101;
const STICKY_FLAG = 1 << 0;
const TAP_FLAG = 1 << 1;
const HOLD_FLAG = 1 << 2;
const CONFIG_SIZE = 32;
const CONFIG_VERSION = 21;  // TrueMap: v19 = 12 expressions and profiles, v20 = combos, tap dance, auto-scroll ...; boards on 18/19 still work
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
const CLEAR_EXTRAS = 106;
const APPEND_EXTRAS = 107;
const GET_EXTRAS = 108;
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
// Settings version of the connected board: 20 (combos, tap dance ...), 19 (profiles, 12 expressions) or 18.
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
    port_devices: {},  // TrueMap: hub port -> device picture (kept on the board as placeholder mappings)
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
    mt_setup();
    pk_setup();
    mt_drag_setup();
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
    if (success) {
        await autoload_after_open();
    }
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
            filters: [{ usbVendorId: 0x05F3, usbProductId: 0x00FF }, { usbVendorId: 0x0554, usbProductId: 0x1001 }, { usbVendorId: 0x0554, usbProductId: 0x0064 }, { usbVendorId: 0x0911, usbProductId: 0x0C1C },
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
    if (success) {
        await autoload_after_open();
    }
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
    await load_board_info();
    update_connection_pill();
    render_board_settings();
    return true;
}

function update_connection_pill() {
    const pill = document.getElementById('connection_pill');
    if (!pill || device == null) {
        return;
    }
    clear_children(pill);
    pill.appendChild(document.createTextNode(board_info.name || 'Connected'));
    if (running_device_type != null && typeof board_type_label == 'function') {
        pill.appendChild(md_element('span', { class: 'md-pill-sub' }, '· ' + board_type_label(running_device_type)));
    }
}

// The PowerMic and foot pedal modes have no settings HID interface; the same 32-byte packets
// travel over its serial port. This wraps the port in the few HIDDevice
// calls the rest of the page uses.
class SerialLink {
    constructor(port) {
        this.port = port;
        this.opened = false;
        this.productName = 'TrueMap';
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

        await load_extras_from_device();

        page_from_file = false;
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
        display_info('Expressions 9-12 are not saved: this board needs the latest TrueMap firmware for them.');
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

    await send_extras_to_device();
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
                page_from_file = false;
                if ((running_device_type !== null) && (config['our_descriptor_number'] != running_device_type)) {
                    running_device_type = null;
                    restart_after_save = 'Saved. The board is restarting as the new device type.';
                } else if (device_v21() && await board_restarting()) {
                    restart_after_save = 'Saved. The board is restarting to load the new settings.';
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
    if (restart_after_save) {
        const msg = restart_after_save;
        restart_after_save = null;
        await reconnect_after_restart(msg);
    }
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
    mt_apply_filter();
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
    }    if (typeof mb_render == 'function' && document.getElementById('mb_steps')) {
        mb_render();
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
    if ((config['version'] < 20) || !config['extras']) {
        config['extras'] = default_extras();
    }
    extras();
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
    if (button_element.classList.contains('mt-chip')) {
        mt_chip(button_element);
        return;
    }
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
    source_button._mapping = mapping;
    target_button._mapping = mapping;
    mt_decorate(clone, mapping);
    container.appendChild(clone);
    set_forced_layers(mapping, clone);
    set_forced_flags(mapping, clone);
    if (modal_return_mapping === mapping) {
        modal_return_element = clone;
    }
}

function download_json() {
    clear_error();
    extras();
    extras_prune();
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
            page_from_file = true;
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
    if (!([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].includes(config_version))) {
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
    for (const version of [CONFIG_VERSION, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) {
        await send_feature_command(GET_CONFIG, [], version);
        const [received_version] = await read_config_feature([UINT8]);
        if (received_version == version) {
            if ((version == CONFIG_VERSION) || (version == 20) || (version == 19) || (version == 18)) {
                device_version = version;
                if (version == 18) {
                    display_info('This board has older TrueMap firmware. It works, but profiles, expressions 9-12, tap dance, auto-scroll and the other new features need the latest firmware.');
                } else if (version == 20) {
                    display_info('This board has older TrueMap firmware. It works, but scroll lock, wheels as keys, the board name, backups and the other newest features need the latest firmware.');
                } else if (version == 19) {
                    display_info('This board has older TrueMap firmware. It works, but tap dance, cycles, auto-scroll, one-shot keys and the other new features need the latest firmware.');
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
        // the last mapping of a blocking combo: offer to put its two buttons back
        const usage = (mapping['source_usage'] || '').toLowerCase();
        if (usage.startsWith('0xfff3') && !config['mappings'].some((m) => (m['source_usage'] || '').toLowerCase() == usage)) {
            const x = xcombos().find((c) => c.index == (parseInt(usage, 16) & 0xFFFF) - 1);
            if (x && confirm('Also put ' + readable_usage_name(x.a) + ' and ' + readable_usage_name(x.b) + ' back the way they were before the combo?')) {
                xcombo_undo(x);
            }
        }
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
        pk_before_show(modal_element, source_or_target, mapping_, element_);
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
                pk_remember(source_or_target, usage);
                if (element.classList.contains('mt-chip')) {
                    mt_chip(element);
                    mt_apply_filter();
                }

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
    mt_apply_filter();
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
    let usage_classes = {};
    for (const k of PK_CONTAINERS) {
        usage_classes[k] = modal_element.querySelector('.' + k + '_usages');
        clear_children(usage_classes[k]);
    }
    pk_layout(usage_classes['keyboard'], PK_KEYBOARD);
    pk_layout(usage_classes['nav'], PK_NAV);
    let template = document.getElementById('usage_button_template');
    const add_usage_buttons = (relevant_usages) => {
        for (const [usage, usage_def] of Object.entries(relevant_usages)) {
            let clone = template.content.cloneNode(true).firstElementChild;
            clone.title = usage;
            clone.setAttribute('data-hid-usage', usage);
            // older outputs live under "More keys"
            pk_place(usage_classes, clone, usage, usage_def['name'], usage_def['hidden'] ? 'more' : usage_def['class']);
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
            clone.title = usage_;
            clone.setAttribute('data-hid-usage', usage_);
            pk_place(usage_classes, clone, usage_, readable_usage_name(usage_), 'extra');
        }
    }

    const search_box = modal_element.querySelector('.usage_search_box');
    search_box.addEventListener("keyup", usage_search_onchange(search_box));
    search_box.addEventListener("input", usage_search_onchange(search_box));
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
    const before = parseInt(config['our_descriptor_number']);
    config['our_descriptor_number'] = parseInt(document.getElementById("our_descriptor_number_dropdown").value, 10);
    offer_target_substitution(before, config['our_descriptor_number']);
    set_ui_state();
    render_live_device();
    render_board_settings();
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
    page_from_file = true;
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
    if (!state && typeof board_info != 'undefined') {
        update_connection_pill();
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
    const xname = extras_source_name(usage);
    if (xname) {
        return xname;
    }
    const combo = combo_of_usage(usage);
    if (combo) {
        return combo.label;
    }
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
    if (typeof usage == 'string' && /^0xffe9/i.test(usage)) {
        return 'Wait ' + (parseInt(usage, 16) & 0xFFFF) + ' ms';
    }
    if (typeof usage == 'string' && /^0xfff2[0-9a-f]{4}$/i.test(usage) && typeof config != 'undefined' && config['macros']) {
        const i = (parseInt(usage, 16) & 0xFFFF) - 1;
        const m = config['macros'][i];
        const name = config['extras'] && config['extras']['macro_names'] ? config['extras']['macro_names'][i] : '';
        if (name) {
            return 'Macro ' + (i + 1) + ': ' + name;
        }
        if (m && m.length && typeof mb_groups == 'function') {
            const preview = mb_groups(m).map((g) => g.type == 'text' ? g.text.replace(/\n/g, '⏎') : g.type == 'pause' ? '⏸' : mb_step_label(g.steps[0])).join(' ');
            return 'Macro ' + (i + 1) + ' (' + (preview.length > 24 ? preview.slice(0, 23) + '…' : preview) + ')';
        }
    }
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
    mt_sync(mapping_container);
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
                live_hit(usage, value, hub_port);
                combo_hit(usage, value, hub_port);
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
            if (usage_button.classList.contains('pk-recent')) {
                return;
            }
            const label = (usage_button.dataset.search || usage_button.innerText).toLowerCase().replaceAll(" ", "");
            usage_button.classList.toggle('d-none', !label.includes(query));
            usage_button.removeAttribute('data-preferred-result');
            if (label.includes(query)) {
                hits++;
                last_match = usage_button;
            }
            const exact_label = (usage_button.dataset.name || usage_button.innerText).toLowerCase().replaceAll(" ", "");
            if ((exact_label == query) || (usage_button.dataset.short && usage_button.dataset.short.toLowerCase() == query)) {
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
        modal_element.classList.toggle('pk-searching', query != '');
        pk_update_sections(modal_element);
    }
}
// ---------------------------------------------------------------------------
// TrueMap: profiles stored on the board (firmware with settings version 19+).

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
    document.getElementById('profiles_backup_row').classList.toggle('d-none', !(supported && device_v21()));
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
    running_device_type = null;
    reconnect_after_restart('Switched to profile ' + (slot + 1) + '. The board is restarting to load it.');
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
            running_device_type = null;
            reconnect_after_restart('Saved as profile ' + (slot + 1) + '. The board is restarting to load it.');
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
// TrueMap app layout: keyboard picture, inspector, profiles sidebar.
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

// Outlines are SVG drawn behind the keys, in the same key units (viewBox 0 0 w h).
// Classes: b = body, b2 = second body shade (wrist rest, thumb rest), plate = keypad
// plate, ball = trackball, line = seam/detail.

// Direction keys: a part of a wheel or knob that only means one way (tilt left,
// jog clockwise...). The board can't map "one way" on its own, so clicking one
// fills in an expression for it (see dir_expressions) and maps that expression.
//   sign: the input is a signed movement or position (tilt, shuttle ring)
//   wrap: the input is a 0-255 position that wraps around (ShuttleXpress jog)
const DIR = (axis, kind, sign, far = false, any = false) => ({ axis, kind, sign, far, any });

function mouse_keys(extra = [], wheel_x = 2.6) {
    return [
        ['Left', 0x00090001, 0.45, 0.4, wheel_x - 0.5, 3.3, false, 'lb'],
        ['Right', 0x00090002, wheel_x + 0.45, 0.4, 5.15 - wheel_x - 0.45, 3.3, false, 'rb'],
        ['⇕', 0x00010038, wheel_x, 0.8, 0.4, 1.4, false, 'wheel'],
        ['Click', 0x00090003, wheel_x - 0.15, 2.35, 0.7, 0.5],
        ['Fwd', 0x00090005, -0.05, 3.9, 0.6, 0.85, false, 'side'],
        ['Back', 0x00090004, -0.05, 4.85, 0.6, 0.85, false, 'side'],
    ].concat(extra);
}

const MOUSE_SVG = '<path class="b" d="M2.8 0.15C4.6 0.15 5.4 1.4 5.4 3.4C5.4 6.2 4.8 8.85 2.8 8.85C0.8 8.85 0.2 6.2 0.2 3.4C0.2 1.4 1 0.15 2.8 0.15Z"/>' +
    '<path class="line" d="M2.8 3.75V0.2"/>';

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
    z15: {
        // EVGA Z15, as drawn by the Vial adapter's Z15 build: media row and volume wheel above the nav cluster / numpad
        code: 11, name: 'EVGA Z15', unit: 33, w: 22.5, h: 7.75,
        keys: [
            ['↺ Vol−', 0x000c00ea, 15.25, 0, 1, 1, false, 'turn'],
            ['↻ Vol+', 0x000c00e9, 16.25, 0, 1, 1, false, 'turn'],
            ['⏮', 0x000c00b6, 18.5, 0, 1, 1],
            ['⏯', 0x000c00cd, 19.5, 0, 1, 1],
            ['⏭', 0x000c00b5, 20.5, 0, 1, 1],
            ['Mute', 0x000c00e2, 21.5, 0, 1, 1],
            ['Esc', 0x29, 0, 1.25, 1, 1],
            ['F1', 0x3a, 2, 1.25, 1, 1],
            ['F2', 0x3b, 3, 1.25, 1, 1],
            ['F3', 0x3c, 4, 1.25, 1, 1],
            ['F4', 0x3d, 5, 1.25, 1, 1],
            ['F5', 0x3e, 6.5, 1.25, 1, 1],
            ['F6', 0x3f, 7.5, 1.25, 1, 1],
            ['F7', 0x40, 8.5, 1.25, 1, 1],
            ['F8', 0x41, 9.5, 1.25, 1, 1],
            ['F9', 0x42, 11.0, 1.25, 1, 1],
            ['F10', 0x43, 12.0, 1.25, 1, 1],
            ['F11', 0x44, 13.0, 1.25, 1, 1],
            ['F12', 0x45, 14.0, 1.25, 1, 1],
            ['PrtSc', 0x46, 15.25, 1.25, 1, 1],
            ['ScrLk', 0x47, 16.25, 1.25, 1, 1],
            ['Pause', 0x48, 17.25, 1.25, 1, 1],
            ['`', 0x35, 0, 2.75, 1, 1],
            ['1', 0x1e, 1, 2.75, 1, 1],
            ['2', 0x1f, 2, 2.75, 1, 1],
            ['3', 0x20, 3, 2.75, 1, 1],
            ['4', 0x21, 4, 2.75, 1, 1],
            ['5', 0x22, 5, 2.75, 1, 1],
            ['6', 0x23, 6, 2.75, 1, 1],
            ['7', 0x24, 7, 2.75, 1, 1],
            ['8', 0x25, 8, 2.75, 1, 1],
            ['9', 0x26, 9, 2.75, 1, 1],
            ['0', 0x27, 10, 2.75, 1, 1],
            ['-', 0x2d, 11, 2.75, 1, 1],
            ['=', 0x2e, 12, 2.75, 1, 1],
            ['Bksp', 0x2a, 13, 2.75, 2, 1],
            ['Ins', 0x49, 15.25, 2.75, 1, 1],
            ['Home', 0x4a, 16.25, 2.75, 1, 1],
            ['PgUp', 0x4b, 17.25, 2.75, 1, 1],
            ['Num', 0x53, 18.5, 2.75, 1, 1],
            ['/', 0x54, 19.5, 2.75, 1, 1],
            ['*', 0x55, 20.5, 2.75, 1, 1],
            ['-', 0x56, 21.5, 2.75, 1, 1],
            ['Tab', 0x2b, 0, 3.75, 1.5, 1],
            ['Q', 0x14, 1.5, 3.75, 1, 1],
            ['W', 0x1a, 2.5, 3.75, 1, 1],
            ['E', 0x8, 3.5, 3.75, 1, 1],
            ['R', 0x15, 4.5, 3.75, 1, 1],
            ['T', 0x17, 5.5, 3.75, 1, 1],
            ['Y', 0x1c, 6.5, 3.75, 1, 1],
            ['U', 0x18, 7.5, 3.75, 1, 1],
            ['I', 0xc, 8.5, 3.75, 1, 1],
            ['O', 0x12, 9.5, 3.75, 1, 1],
            ['P', 0x13, 10.5, 3.75, 1, 1],
            ['[', 0x2f, 11.5, 3.75, 1, 1],
            [']', 0x30, 12.5, 3.75, 1, 1],
            ['\\', 0x31, 13.5, 3.75, 1.5, 1],
            ['Del', 0x4c, 15.25, 3.75, 1, 1],
            ['End', 0x4d, 16.25, 3.75, 1, 1],
            ['PgDn', 0x4e, 17.25, 3.75, 1, 1],
            ['7', 0x5f, 18.5, 3.75, 1, 1],
            ['8', 0x60, 19.5, 3.75, 1, 1],
            ['9', 0x61, 20.5, 3.75, 1, 1],
            ['+', 0x57, 21.5, 3.75, 1, 2],
            ['Caps', 0x39, 0, 4.75, 1.75, 1],
            ['A', 0x4, 1.75, 4.75, 1, 1],
            ['S', 0x16, 2.75, 4.75, 1, 1],
            ['D', 0x7, 3.75, 4.75, 1, 1],
            ['F', 0x9, 4.75, 4.75, 1, 1],
            ['G', 0xa, 5.75, 4.75, 1, 1],
            ['H', 0xb, 6.75, 4.75, 1, 1],
            ['J', 0xd, 7.75, 4.75, 1, 1],
            ['K', 0xe, 8.75, 4.75, 1, 1],
            ['L', 0xf, 9.75, 4.75, 1, 1],
            [';', 0x33, 10.75, 4.75, 1, 1],
            ["'", 0x34, 11.75, 4.75, 1, 1],
            ['Enter', 0x28, 12.75, 4.75, 2.25, 1],
            ['4', 0x5c, 18.5, 4.75, 1, 1],
            ['5', 0x5d, 19.5, 4.75, 1, 1],
            ['6', 0x5e, 20.5, 4.75, 1, 1],
            ['Shift', 0xe1, 0, 5.75, 2.25, 1],
            ['Z', 0x1d, 2.25, 5.75, 1, 1],
            ['X', 0x1b, 3.25, 5.75, 1, 1],
            ['C', 0x6, 4.25, 5.75, 1, 1],
            ['V', 0x19, 5.25, 5.75, 1, 1],
            ['B', 0x5, 6.25, 5.75, 1, 1],
            ['N', 0x11, 7.25, 5.75, 1, 1],
            ['M', 0x10, 8.25, 5.75, 1, 1],
            [',', 0x36, 9.25, 5.75, 1, 1],
            ['.', 0x37, 10.25, 5.75, 1, 1],
            ['/', 0x38, 11.25, 5.75, 1, 1],
            ['Shift', 0xe5, 12.25, 5.75, 2.75, 1],
            ['↑', 0x52, 16.25, 5.75, 1, 1],
            ['1', 0x59, 18.5, 5.75, 1, 1],
            ['2', 0x5a, 19.5, 5.75, 1, 1],
            ['3', 0x5b, 20.5, 5.75, 1, 1],
            ['Enter', 0x58, 21.5, 5.75, 1, 2],
            ['Ctrl', 0xe0, 0, 6.75, 1.25, 1],
            ['Win', 0xe3, 1.25, 6.75, 1.25, 1],
            ['Alt', 0xe2, 2.5, 6.75, 1.25, 1],
            ['Space', 0x2c, 3.75, 6.75, 6.25, 1],
            ['AltGr', 0xe6, 10.0, 6.75, 1.25, 1],
            ['Win', 0xe7, 11.25, 6.75, 1.25, 1],
            ['Menu', 0x65, 12.5, 6.75, 1.25, 1],
            ['Ctrl', 0xe4, 13.75, 6.75, 1.25, 1],
            ['←', 0x50, 15.25, 6.75, 1, 1],
            ['↓', 0x51, 16.25, 6.75, 1, 1],
            ['→', 0x4f, 17.25, 6.75, 1, 1],
            ['0', 0x62, 18.5, 6.75, 2, 1],
            ['.', 0x63, 20.5, 6.75, 1, 1],
        ],
        note: 'The volume wheel sends Volume down / up once per notch (↺ / ↻), so each direction can be mapped on its own. The media keys (previous, play/pause, next, mute) can be mapped like any key. The Z15’s own Fn key never leaves the keyboard, so its Fn combinations can’t be mapped.',
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
        code: 2, name: '68-key keyboard (65%)', unit: 38, w: 16, h: 6.25,
        keys: [].concat(
            // F1-F12 are Fn + 1 ... Fn + = on this keyboard: drawn above the number keys they share
            kb_rows([F_KEYS(1, 12)], 1, 0),
            kb_rows([
                [['Esc', 0x29]].concat(ROW_NUM.slice(1), [['`', 0x35]]),
                ROW_Q.concat([['Del', 0x4c]]),
                ROW_A.concat([['PgUp', 0x4b]]),
                ROW_Z.concat([['Shift', 0xe5, 1.75], ['↑', 0x52], ['PgDn', 0x4e]]),
                [['Ctrl', 0xe0, 1.25], ['Win', 0xe3, 1.25], ['Alt', 0xe2, 1.25], ['Space', 0x2c, 6.25], ['Alt', 0xe6], ['Fn', null], ['Ctrl', 0xe4], ['←', 0x50], ['↓', 0x51], ['→', 0x4f]],
            ], 0, 1.25),
        ),
        note: 'The top row is Fn + 1 … Fn + = (F1–F12). Fn itself is handled inside the keyboard, so it can\'t be mapped. Other Fn keys (Pause on `, Ins on Del, Home on PgUp, End on PgDn) send their own keys: press one in Live test to see its code.',
    },
    km16: {
        // MMD KM16 Pro: aluminium case, two small knobs and a large dial above a 4x4 grid
        shape: 'km16',
        code: 6, name: 'MMD KM16 Pro', unit: 64, w: 4.5, h: 6.15,
        svg: '<rect class="b" x="0.05" y="0.05" width="4.4" height="6.05" rx="0.32"/>' +
            '<rect class="plate" x="0.17" y="1.68" width="4.16" height="4.3" rx="0.12"/>' +
            '<circle class="knob" cx="0.72" cy="0.68" r="0.38"/><circle class="knob" cx="1.82" cy="0.68" r="0.38"/>' +
            '<circle class="knob big" cx="3.3" cy="0.82" r="0.7"/>',
        keys: [
            ['W', 0x1a, 0.4, 0.36, 0.64, 0.64, true],
            ['↺ A', 0x04, 0.2, 1.1, 0.52, 0.42, false, 'turn'], ['↻ D', 0x07, 0.73, 1.1, 0.52, 0.42, false, 'turn'],
            ['Layer', null, 1.5, 0.36, 0.64, 0.64, true],
            ['↺ ;', 0x33, 1.3, 1.1, 0.52, 0.42, false, 'turn'], ["↻ '", 0x34, 1.83, 1.1, 0.52, 0.42, false, 'turn'],
            ['F9', 0x42, 2.83, 0.35, 0.94, 0.94, true],
            ['↺ Vol−', 0x000c00ea, 2.35, 1.2, 0.66, 0.42, false, 'turn'], ['↻ Vol+', 0x000c00e9, 3.6, 1.2, 0.66, 0.42, false, 'turn'],
        ].concat(kb_rows([
            [['F4', 0x3d], ['F1', 0x3a], ['F2', 0x3b], ['F3', 0x3c]],
            [['1', 0x1e], ['2', 0x1f], ['3', 0x20], ['4', 0x21]],
            [['R', 0x15], ['Q', 0x14], ['E', 0x08], ['W', 0x1a]],
            [['N', 0x11], ['Z', 0x1d], ['←', 0x50], ['→', 0x4f]],
        ], 0.25, 1.78, 1.04)),
        note: 'Keys and knobs as your VIA layout sets them: each knob\'s press is the circle, its turns are ↺ and ↻ under it (they send keys, so they map like keys). If you change the layout in VIA, these labels won\'t match.',
    },
    mouse: { code: 7, name: 'Regular mouse', unit: 40, w: 5.6, h: 9, shape: 'mouse', svg: MOUSE_SVG, keys: mouse_keys() },
    g502: {
        // Logitech G502 (HERO / LIGHTSPEED / X): top view, thumb rest on the left
        code: 3, name: 'Logitech G502', unit: 40, w: 6.4, h: 10, shape: 'mouse',
        svg: '<path class="b" d="M1 1C1.3 0.3 2.6 0.05 3.4 0.1C4.3 0.1 5.4 0.3 5.7 1C6 2 5.8 4.4 5.55 5.6C5.4 6.6 5.95 8 5.6 9C5.1 9.9 2.8 10 1.8 9.6C1 9.3 0.15 8.9 0.15 8C0.15 7.3 0.5 6.9 0.45 6.4C0.35 5.6 0.3 4.6 0.5 4C0.7 3 0.8 1.6 1 1Z"/>' +
            '<path class="b2" d="M0.45 6.5C0.5 7 0.15 7.3 0.15 8C0.15 8.9 1 9.3 1.8 9.6C1.5 8.6 1.4 7.4 1.6 6.4C1.2 6.3 0.8 6.3 0.45 6.5Z"/>' +
            '<path class="line" d="M1.55 4.05H5.5M3.4 4.05V0.15"/>' +
            '<circle class="line" cx="3.55" cy="7.4" r="0.55"/>',
        keys: [
            ['Left', 0x00090001, 1.55, 0.45, 1.3, 3.55, false, 'lb'],
            ['Right', 0x00090002, 3.95, 0.45, 1.6, 3.55, false, 'rb'],
            ['F15', 0x6A, 0.95, 1.2, 0.58, 0.78, false, 'side'],
            ['F14', 0x69, 0.95, 2.05, 0.58, 0.78, false, 'side'],
            ['F18', 0x6D, 2.88, 1.0, 0.32, 1.05, false, 'tilt'],
            ['⇕', 0x00010038, 3.2, 0.7, 0.44, 1.65, false, 'wheel'],
            ['F17', 0x6C, 3.62, 1.0, 0.32, 1.05, false, 'tilt'],
            ['Click', 0x00090003, 3.05, 2.4, 0.74, 0.46],
            ['Mode', null, 3.02, 2.9, 0.8, 0.38],
            ['F16', 0x6B, 3.07, 3.32, 0.7, 0.5],
            ['F13', 0x68, 0.38, 4.0, 0.55, 0.72, false, 'side sniper'],
            ['Fwd', 0x00090005, 0.3, 4.8, 0.6, 0.72, false, 'side'],
            ['Back', 0x00090004, 0.3, 5.56, 0.6, 0.72, false, 'side'],
        ],
        note: 'Set up in Logitech Onboard Memory Manager as: sniper (DPI Shift) = F13, Previous DPI = F14, Next DPI = F15, the button behind the wheel = F16, tilt right = F17, tilt left = F18; everything else left at its default. Turn on "Light up keys" and press each button to check which one is which. Wheel mode is handled inside the mouse.',
    },
    g303: {
        code: 4, name: 'Logitech G303', unit: 40, w: 5.6, h: 9.4, shape: 'mouse',
        svg: '<path class="b" d="M1.2 0.3L4.4 0.3L5.3 1.6L5 4.6L5.4 7.6L4.4 9.1L1.2 9.1L0.2 7.6L0.6 4.6L0.3 1.6Z"/><path class="line" d="M2.8 3.75V0.35M1.2 9.1L1.6 4.4M4.4 9.1L4 4.4"/>',
        keys: mouse_keys([['DPI', null, 2.5, 2.95, 0.6, 0.45]]),
        note: 'The DPI button works inside the mouse, so it can\'t be mapped.',
    },
    em06: {
        // ProtoArc EM06 (from ProtoArc's top-down product photo): 55 mm ball in the
        // middle, 4 buttons across the top, one down each side, one under the ball,
        // wrist rest below. What each button sends is set in ProtoArc's app.
        code: 5, name: 'ProtoArc EM06', unit: 34, w: 8.1, h: 12.8, shape: 'trackball',
        svg: '<rect class="b" x="0.05" y="0.05" width="8" height="12.7" rx="1.15"/>' +
            '<rect class="plate" x="0.25" y="0.2" width="7.6" height="8.2" rx="0.8"/>' +
            '<circle class="line" cx="4.05" cy="4.3" r="2.05"/>' +
            '<circle class="ball" cx="4.05" cy="4.3" r="1.6"/>' +
            '<rect class="b2" x="0.4" y="8.7" width="7.3" height="3.85" rx="0.9"/>',
        keys: [
            ['Left', 0x00090001, 0.4, 0.32, 1.65, 3.85, false, 'em-tl'],
            ['Back', 0x00090004, 2.15, 0.32, 1.8, 1.9, false, 'em-tm'],
            ['Fwd', 0x00090005, 4.15, 0.32, 1.8, 1.9, false, 'em-tm'],
            ['Right', 0x00090002, 6.05, 0.32, 1.65, 3.85, false, 'em-tr'],
            ['Scroll ⇕', 0x00010038, 3.0, 3.25, 2.1, 2.1, true, 'ballkey'],
            ['Btn 6', 0x00090006, 0.4, 4.4, 1.65, 3.85, false, 'em-bl'],
            ['Middle', 0x00090003, 2.45, 6.45, 3.2, 1.8, false, 'em-bm'],
            ['Btn 7', 0x00090007, 6.05, 4.4, 1.65, 3.85, false, 'em-br'],
        ],
        note: 'Layout from ProtoArc\'s photo. What each button sends is set in ProtoArc\'s app, so the labels are a guess: turn on "Light up keys as I press them" and press each one to check. Buttons set to send keys show up in the list below the picture.',
    },
    magscroll: {
        code: 8, name: 'MagScroll', unit: 50, w: 4, h: 3.4, shape: 'knob',
        keys: [['Turn to scroll', 0x00010038, 0.5, 0.2, 3, 3, true]],
        note: 'The knob scrolls like a mouse wheel. Set it up on the MagScroll page.',
    },
    shuttle: {
        code: 9, name: 'Contour ShuttleXpress', unit: 46, w: 4.8, h: 5.0, shape: 'shuttle',
        svg: '<path class="b" d="M2.4 0.05C3.9 0.05 4.75 0.9 4.75 2.3C4.75 3.9 3.8 4.95 2.4 4.95C1 4.95 0.05 3.9 0.05 2.3C0.05 0.9 0.9 0.05 2.4 0.05Z"/>',
        keys: [
            ['1', 0x00090005, 0.2, 1.4, 0.75, 0.62], ['2', 0x00090006, 0.8, 0.45, 0.75, 0.62], ['3', 0x00090007, 2.02, 0.12, 0.75, 0.62],
            ['4', 0x00090008, 3.25, 0.45, 0.75, 0.62], ['5', 0x00090009, 3.85, 1.4, 0.75, 0.62],
            ['Shuttle ring', 0x00010038, 1.15, 1.25, 2.5, 2.5, true, 'ring'], ['Jog', 0x00010037, 1.8, 1.9, 1.2, 1.2, true],
            ['◀ ring', null, 0.12, 2.25, 0.95, 0.55, false, 'dirk', DIR(0x00010038, 'sign', -1)],
            ['ring ▶', null, 3.73, 2.25, 0.95, 0.55, false, 'dirk', DIR(0x00010038, 'sign', 1)],
            ['◀◀ far', null, 0.12, 2.85, 0.95, 0.55, false, 'dirk', DIR(0x00010038, 'sign', -1, true)],
            ['far ▶▶', null, 3.73, 2.85, 0.95, 0.55, false, 'dirk', DIR(0x00010038, 'sign', 1, true)],
            ['↺ ring', null, 0.12, 3.45, 0.95, 0.55, false, 'dirk', DIR(0x00010038, 'sign', -1, false, true)],
            ['ring ↻', null, 3.73, 3.45, 0.95, 0.55, false, 'dirk', DIR(0x00010038, 'sign', 1, false, true)],
            ['↺ jog', null, 1.3, 3.95, 1.0, 0.55, false, 'dirk', DIR(0x00010037, 'wrap', -1)],
            ['jog ↻', null, 2.5, 3.95, 1.0, 0.55, false, 'dirk', DIR(0x00010037, 'wrap', 1)],
        ],
        note: '◀ ring / ring ▶ fire on a small turn, ◀◀ far / far ▶▶ on a bigger one (set where "far" starts in the panel), ↺ ring / ring ↻ on any turn counter-clockwise / clockwise. ↺ jog / jog ↻ fire once per click. Needs a board that handles low-speed USB: the Feather works, the Waveshare RP2350 doesn\'t.',
    },
};
const DEVICE_ORDER = ['full', 'z15', 'k75', 'k68', 'km16', 'mouse', 'g502', 'g303', 'em06', 'magscroll', 'shuttle'];
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
    for (const p of ['0', current_port]) {
        if (!ports.includes(p)) {
            ports.push(p);  // "Any port" is always there; so is a port with no device chosen yet
        }
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
        if (device.svg) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'md-dev-svg');
            svg.setAttribute('viewBox', '0 0 ' + device.w + ' ' + device.h);
            svg.setAttribute('aria-hidden', 'true');
            svg.innerHTML = device.svg;
            pic.appendChild(svg);
        }
        for (const [label, usage, x, y, w = 1, h = 1, round = false, extra = '', dir = null] of device.keys) {
            const fixed = usage === null && !dir;
            const key = md_element('button', { type: 'button', class: 'md-key' + (round ? ' round' : '') + (fixed ? ' fixed' : '') + (extra ? ' ' + extra : '') });
            key.style.left = (x * u + 2) + 'px';
            key.style.top = (y * u + 2) + 'px';
            key.style.width = (w * u - 4) + 'px';
            key.style.height = (h * u - 4) + 'px';
            key.appendChild(md_element('span', {}, label));
            if (dir) {
                // its mapping source is an expression, found or made on click (dir_expressions)
                key.dataset.axis = key_usage(dir.axis);
                key.dataset.kind = dir.kind;
                key.dataset.sign = String(dir.sign);
                key.dataset.far = dir.far ? '1' : '';
                key.dataset.any = dir.any ? '1' : '';
                key.setAttribute('aria-label', readable_usage_name(key_usage(dir.axis)) + ' ' + label);
                key.addEventListener('click', () => dir_key_clicked(dir));
            } else if (fixed) {
                key.disabled = true;
                key.title = label + ': handled inside the device, can\'t be mapped';
            } else {
                key.dataset.usage = key_usage(usage);
                key.setAttribute('aria-label', readable_usage_name(key_usage(usage)) + ' (' + label + ')');
                key.addEventListener('click', () => kb_key_clicked(key_usage(usage)));
            }
            pic.appendChild(key);
        }
        md_fit_labels_soon();
        const note = document.getElementById('dev_note');
        note.innerText = device.note || '';
        note.classList.toggle('d-none', !device.note);
    }
}

function kb_key_clicked(usage) {
    if (combo_state) {
        combo_pick(usage);
        return;
    }
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

// Expressions behind a direction key, in the saved (x1000) form. The first is the
// one that gets mapped; a "wrap" input also needs a helper that remembers the last
// position, which must run after it (expressions run in order), in register 32 - port.
function dir_expressions(dir, port) {
    const p = (port * 1000) + ' port ';
    const a = '0x' + (dir.axis >>> 0).toString(16).padStart(8, '0');
    const cmp = dir.sign > 0 ? 'gt' : 'lt';
    if (dir.kind == 'sign') {
        return { main: p + a + ' input_state 0 ' + cmp + ' 0 port', helper: null };
    }
    const r = ((32 - port) * 1000) + '';
    return {
        main: p + a + ' input_state_binary ' + a + ' input_state ' + r + ' recall sub 384000 add 256000 mod 128000 sub mul 0 ' + cmp + ' 0 port',
        helper: p + a + ' input_state ' + a + ' input_state ' + r + ' recall ifte ' + r + ' store 0 port',
    };
}

function expr_norm(text) {
    return (text || '').trim().split(/\s+/).join(' ');
}

function find_expression(text) {
    const want = expr_norm(text);
    return config['expressions'].findIndex((e, i) => i < device_nexpressions() && expr_norm(e) == want);
}

// the expression usage (0xfff3000N) a direction key is mapped through, or null
function dir_key_usage(dir, port) {
    if (config['extras'] && config['extras']['wheel_keys']) {
        const w = config['extras']['wheel_keys'].findIndex((k) => parseInt(k.usage, 16) == dir.axis && (k.port || 0) == port);
        if (w >= 0) {
            const kind2 = config['extras']['wheel_keys'][w].kind == 2;
            const tries = dir.far ? [dir.sign > 0 ? 3 : 4] : (kind2 && !dir.any ? [dir.sign > 0 ? 5 : 6] : [dir.sign > 0 ? 1 : 2]);
            for (const a of tries) {
                const usage = x_wheel_usage(w, a);
                if (config['mappings'].some((m) => x_same_key(m['source_usage'], usage))) {
                    return usage;
                }
            }
        }
    }
    const i = find_expression(dir_expressions(dir, port).main);
    return i < 0 ? null : '0xfff3' + (i + 1).toString(16).padStart(4, '0');
}

function dir_key_clicked(dir) {
    if (combo_state) {
        return;  // wheels and knobs can't be part of a combo
    }
    const port = parseInt(current_port);
    if (dir.far && device != null && !device_v21()) {
        alert('Far turns need the latest TrueMap firmware on the board.');
        return;
    }
    if (device == null || device_v21()) {
        // the board reads wheels, jogs and dials itself: no expression needed
        const kind = dir.kind == 'wrap' ? 1 : (dir.axis == 0x00010038 ? 2 : 0);
        const existing = dir_key_usage(dir, port);
        const a = existing && /^0xffe8/i.test(existing) ? (parseInt(existing, 16) & 0xF)
            : dir.far ? (dir.sign > 0 ? 3 : 4) : (kind == 2 && !dir.any) ? (dir.sign > 0 ? 5 : 6) : (dir.sign > 0 ? 1 : 2);
        const m = wheel_keys_mapping(xu(dir.axis), port, kind, a);
        if (m) {
            set_mappings_ui_state();
            md_select(m, true);
        }
        return;
    }
    const ex = dir_expressions(dir, port);
    const n = device_nexpressions();
    const free = () => config['expressions'].findIndex((e, i) => i < n && expr_norm(e) == '');
    let main = find_expression(ex.main);
    if (main < 0) {
        main = free();
        if (main < 0) {
            alert('All ' + n + ' expressions are in use. Clear one on the Expressions tab first.');
            return;
        }
        config['expressions'][main] = ex.main;
    }
    if (ex.helper) {
        let helper = find_expression(ex.helper);
        if (helper < main) {
            // it has to run after the expression it feeds: use the last free slot
            const last_free = config['expressions'].map((e, i) => (i < n && i > main && expr_norm(e) == '') ? i : -1).filter((i) => i >= 0).pop();
            if (last_free === undefined) {
                if (helper < 0) {
                    config['expressions'][main] = '';
                }
                alert('This needs two free expressions (one after the other). Clear some on the Expressions tab first.');
                return;
            }
            if (helper >= 0) {
                config['expressions'][helper] = '';
            }
            config['expressions'][last_free] = ex.helper;
        }
    }
    set_expressions_ui_state();
    const usage = '0xfff3' + (main + 1).toString(16).padStart(4, '0');
    let mapping = config['mappings'].find((m) => m['source_usage'] == usage);
    if (!mapping) {
        add_empty_mapping(usage);
        mapping = config['mappings'][config['mappings'].length - 1];
        set_mappings_ui_state();
    }
    selected_mapping = mapping;
    md_refresh();
    const row = mapping_row(mapping);
    if (row) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// the port a mapping's input listens to; for an expression made by a direction key,
// the port in its "N port" prefix
function mapping_port(m) {
    const usage = m['source_usage'];
    if (typeof usage == 'string' && /^0xffe[1238]/i.test(usage) && config['extras']) {
        const x = config['extras'];
        const v = parseInt(usage, 16) & 0xFFFF;
        const page = usage.slice(0, 6).toLowerCase();
        const def = page == '0xffe1' ? x.combos[v - 1] : page == '0xffe2' ? x.tapdances[v >> 4] : page == '0xffe8' ? (x.wheel_keys || [])[v >> 4] : x.cycles[v >> 4];
        if (def) {
            return def.port || 0;
        }
    }
    if (typeof usage == 'string' && usage.toLowerCase().startsWith('0xfff5')) {
        const c = combo_of_usage(usage);
        if (c) {
            return c.port;
        }
    }
    if (usage.startsWith('0xfff3')) {
        const e = config['expressions'][(parseInt(usage, 16) & 0xFFFF) - 1];
        const match = /^(\d+) port /.exec(expr_norm(e));
        if (match) {
            return parseInt(match[1]) / 1000;
        }
    }
    return m['source_port'] || 0;
}

const kb_last_value = {};
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
    // direction keys: light the one that matches the way it moved
    const last = kb_last_value[usage];
    kb_last_value[usage] = value;
    document.querySelectorAll('#kb_picture .md-key[data-axis="' + usage + '"]').forEach((element) => {
        let way = Math.sign(value);
        if (element.dataset.kind == 'wrap') {
            way = (last === undefined) ? 0 : Math.sign(((value - last + 384) % 256) - 128);
        }
        if (way != 0 && way == parseInt(element.dataset.sign)) {
            element.classList.add('hit');
            clearTimeout(element._hit_timer);
            element._hit_timer = setTimeout(() => element.classList.remove('hit'), 400);
        } else if (element.dataset.kind == 'sign') {
            element.classList.remove('hit');
        }
    });
}

// Mappings that fire together by mistake: same input, a layer in common, and the
// same port (or one of them on Any port). A tap mapping and a hold mapping of one
// key are a pair, not a collision. Returns Map(mapping -> [indexes of the others]).
function mapping_collisions() {
    const out = new Map();
    const ms = config['mappings'];
    for (let i = 0; i < ms.length; i++) {
        for (let j = i + 1; j < ms.length; j++) {
            const a = ms[i], b = ms[j];
            if ((a['source_usage'] || '').toLowerCase() != (b['source_usage'] || '').toLowerCase() || a['source_usage'] == '0x00000000') {
                continue;
            }
            const pa = a['source_port'] || 0, pb = b['source_port'] || 0;
            if (pa != pb && pa != 0 && pb != 0) {
                continue;
            }
            if (!(a['layers'] || [0]).some((l) => (b['layers'] || [0]).includes(l))) {
                continue;
            }
            if ((a['tap'] && b['hold']) || (a['hold'] && b['tap'])) {
                continue;
            }
            if (!out.has(a)) out.set(a, []);
            if (!out.has(b)) out.set(b, []);
            out.get(a).push(j);
            out.get(b).push(i);
        }
    }
    return out;
}

function md_refresh() {
    if (config['extras']) {
        extras_prune();
        wheel_keys_prune();
    }
    if (selected_mapping && !config['mappings'].includes(selected_mapping)) {
        selected_mapping = null;
    }
    render_port_bar();
    render_device_picture();
    render_live_device();
    render_board_settings();
    const port = parseInt(current_port);
    const first_index = {};
    config['mappings'].forEach((m, i) => {
        if (((m['source_port'] || 0) == port) && !(m['source_usage'] in first_index)) {
            first_index[m['source_usage']] = i;
        }
    });
    const on_picture = new Set();
    // direction keys are mapped through an expression (on "any port"; the port is inside it)
    const any_index = {};
    config['mappings'].forEach((m, i) => {
        if (((m['source_port'] || 0) == 0) && !(m['source_usage'] in any_index)) {
            any_index[m['source_usage']] = i;
        }
    });
    document.querySelectorAll('#kb_picture .md-key[data-axis]').forEach((key) => {
        const dir = { axis: parseInt(key.dataset.axis, 16), kind: key.dataset.kind, sign: parseInt(key.dataset.sign), far: key.dataset.far == '1', any: key.dataset.any == '1' };
        const usage = dir_key_usage(dir, port);
        if (usage) {
            key.dataset.usage = usage;
            key.dataset.expr = '1';
        } else {
            delete key.dataset.usage;
            key.classList.remove('m', 'sel');
            const badge = key.querySelector('.md-badge');
            if (badge) {
                badge.remove();
            }
            key.title = key.getAttribute('aria-label') + ' (not mapped: click to set it up)';
        }
    });
    document.querySelectorAll('#kb_picture .md-key[data-usage]').forEach((key) => {
        const usage = key.dataset.usage;
        const via_expr = key.dataset.expr == '1';
        on_picture.add(usage);
        const i = via_expr ? any_index[usage] : first_index[usage];
        const mapped = i !== undefined;
        key.classList.toggle('m', mapped);
        key.classList.toggle('sel', !!selected_mapping && selected_mapping['source_usage'] == usage && (via_expr || (selected_mapping['source_port'] || 0) == port));
        let badge = key.querySelector('.md-badge');
        if (mapped) {
            if (!badge) {
                badge = md_element('span', { class: 'md-badge' });
                key.appendChild(badge);
            }
            badge.innerText = i + 1;
            key.title = (via_expr ? key.getAttribute('aria-label') : readable_usage_name(usage)) + ' → ' + readable_target_usage_name(config['mappings'][i]['target_usage']);
        } else {
            if (badge) {
                badge.remove();
            }
            key.title = (via_expr ? key.getAttribute('aria-label') : readable_usage_name(usage)) + ' (not mapped)';
        }
    });
    // this port's mappings whose input isn't on the picture
    const other = document.getElementById('kb_other');
    clear_children(other);
    config['mappings'].forEach((m, i) => {
        if ((mapping_port(m) != port) || on_picture.has(m['source_usage']) || (m['source_usage'] == '0x00000000')) {
            return;
        }
        const chip = md_element('button', { type: 'button', class: 'md-chip' + (m === selected_mapping ? ' sel' : '') + ((combo_of_usage(m['source_usage']) || /^0xffe[1238]/i.test(m['source_usage'])) ? ' combo' : '') });
        chip.dataset.usage = m['source_usage'];
        chip.appendChild(md_element('b', {}, String(i + 1)));
        chip.appendChild(document.createTextNode('source_name' in m ? m['source_name'] : readable_usage_name(m['source_usage'])));
        chip.addEventListener('click', () => md_select(m, true));
        other.appendChild(chip);
    });
    // rows
    const collisions = mapping_collisions();
    document.querySelectorAll('#kb_picture .md-key[data-usage]').forEach((key) => {
        const u = key.dataset.usage;
        key.classList.toggle('collide', config['mappings'].some((m) => collisions.has(m) && m['source_usage'] == u && (key.dataset.expr == '1' || [0, port].includes(m['source_port'] || 0))));
    });
    const rows = document.querySelectorAll('#mappings .mapping_container');
    rows.forEach((row, i) => {
        const m = config['mappings'][i];
        row.classList.toggle('md-selected', !!m && m === selected_mapping);
        const others = m ? collisions.get(m) : null;
        row.classList.toggle('md-collide', !!others);
        let warn = row.querySelector('.md-collide-badge');
        if (others) {
            if (!warn) {
                warn = md_element('span', { class: 'md-collide-badge' });
                row.prepend(warn);
            }
            warn.innerText = '⚠ fires together with #' + others.map((k) => k + 1).join(', #');
            warn.title = 'Same input, same port and a layer in common: both mappings fire. Delete one, or give them different layers or ports.';
        } else if (warn) {
            warn.remove();
        }
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
                    current_port = String(mapping_port(mapping));
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
    live_setup();
    combo_setup();
    macro_builder_setup();
    board_setup();
    key_features_setup();
    v21_setup();
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
    const clash = mapping_collisions().get(m);
    if (clash) {
        insp.appendChild(md_element('div', { class: 'md-insp-warn' },
            '⚠ This input is also used by mapping #' + clash.map((k) => k + 1).join(', #') + ' on the same port and layer, so both fire. Delete one, or give them different layers or ports.'));
    }

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
    // several inputs, one action: a copy of this mapping with its own input
    const another = md_element('button', { type: 'button', class: 'btn btn-sm btn-link md-insp-link' }, '+ Another input does the same');
    another.addEventListener('click', () => {
        const copy = Object.assign({}, m, { 'source_usage': '0x00000000', 'layers': [...(m['layers'] || [0])] });
        delete copy['source_name'];
        config['mappings'].push(copy);
        set_mappings_ui_state();
        selected_mapping = copy;
        md_refresh();
        const row = mapping_row(copy);
        if (row) {
            row.querySelector('.source_button').click();  // pick its input straight away
        }
    });
    input_set.appendChild(another);
    const same = config['mappings'].filter((x) => x !== m && x['target_usage'] == m['target_usage'] && m['target_usage'] != '0x00000000');
    if (same.length) {
        input_set.appendChild(md_element('div', { class: 'md-insp-note' }, 'Also sent by: ' + same.map((x) => '#' + (mapping_index(x) + 1) + ' ' + readable_usage_name(x['source_usage'])).join(', ')));
    }
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
    if (type == 9 || type == 10) {
        const page = type == 9 ? '0xff03' : '0xff04';
        picks = Object.keys(usages[type]).filter((u) => u.startsWith(page));
    }
    if (picks) {
        const grid = md_element('div', { class: 'md-pick', role: 'group', 'aria-label': 'Quick picks' });
        for (const usage of picks) {
            if (!(usage in usages[type])) {
                continue;
            }
            const name = usages[type][usage]['name'].replace(/^PowerMic (4 )?/, '').replace(/^SpeechMike /, '').replace(/^Foot pedal /, '');
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
    // type a phrase: made into a macro and sent by this mapping
    const text_row = md_element('div', { class: 'input-group input-group-sm md-insp-text' });
    const text_in = md_element('input', { type: 'text', class: 'form-control', placeholder: 'Type text… e.g. No acute findings.', 'aria-label': 'Text this input types' });
    const text_go = md_element('button', { type: 'button', class: 'btn btn-outline-secondary' }, 'Use');
    const use_text = () => {
        const { steps, skipped } = mb_text_steps(text_in.value);
        if (!steps.length) {
            return;
        }
        // reuse this mapping's macro if it already sends one, else the first empty macro
        let slot = /^0xfff2[0-9a-f]{4}$/i.test(m['target_usage']) ? (parseInt(m['target_usage'], 16) & 0xFFFF) - 1 : config['macros'].findIndex((x) => !x || x.length == 0);
        if (slot < 0) {
            alert('All ' + NMACROS + ' macros are in use. Clear one on the Macros tab first.');
            return;
        }
        if (skipped.size) {
            alert('These characters have no key on a US keyboard and were left out: ' + [...skipped].join(' '));
        }
        const keep = mb_slot;
        mb_slot = slot;
        config['macros'][slot] = [];
        mb_append(steps);
        mb_slot = keep;
        m['target_usage'] = '0xfff2' + (slot + 1).toString(16).padStart(4, '0');
        md_mapping_changed();
    };
    text_go.addEventListener('click', use_text);
    text_in.addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            use_text();
        }
    });
    text_row.appendChild(text_in);
    text_row.appendChild(text_go);
    output_set.appendChild(text_row);
    // presets for things layers can already do
    const presets = md_element('div', { class: 'md-presets' });
    const mode_btn = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', title: 'Press once for layer 1, again to go back (like a shift lock for your mappings)' }, 'Mode switch (layer 1)');
    mode_btn.addEventListener('click', () => {
        m['target_usage'] = '0xfff10001';
        m['sticky'] = true;
        m['tap'] = false;
        m['hold'] = false;
        m['layers'] = [...new Set([...(m['layers'] || [0]), 0, 1])].sort();
        md_mapping_changed();
    });
    const pause_btn = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', title: 'Press once to turn every mapping off (keys pass through as normal), again to turn them back on' }, 'Pause all mappings');
    pause_btn.addEventListener('click', () => {
        // layer 7 with nothing on it, keys passing through there
        const users = config['mappings'].filter((x) => x !== m && (x['layers'] || []).includes(7));
        if (users.length && !confirm(users.length + ' mapping(s) also work on layer 7, so they would stay on while paused. Continue?')) {
            return;
        }
        m['target_usage'] = '0xfff10007';
        m['sticky'] = true;
        m['tap'] = false;
        m['hold'] = false;
        m['layers'] = [...new Set([...(m['layers'] || [0]), 0, 7])].sort();
        const pass = new Set(config['unmapped_passthrough_layers'] || []);
        pass.add(7);
        config['unmapped_passthrough_layers'] = [...pass].sort();
        set_ui_state();
        md_mapping_changed();
    });
    // tap to switch layer 1 on and off, hold for layer 1 while held
    const tt_btn = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', title: 'Tap: layer 1 on (tap again: off). Hold: layer 1 only while held.' }, 'Tap toggles, hold holds (layer 1)');
    tt_btn.addEventListener('click', () => {
        m['target_usage'] = '0xfff10001';
        m['sticky'] = false;
        m['tap'] = false;
        m['hold'] = true;
        m['layers'] = [...new Set([...(m['layers'] || [0]), 0])].sort();
        const t = config['mappings'].find((x) => x !== m && x_same_key(x['source_usage'], m['source_usage']) && x['target_usage'] == '0xfff10001' && x['tap'] && x['sticky']);
        if (!t) {
            config['mappings'].push(Object.assign(new_mapping_like(m), { 'source_usage': m['source_usage'], 'source_port': m['source_port'] || 0, 'target_usage': '0xfff10001', 'tap': true, 'sticky': true }));
        }
        set_mappings_ui_state();
        md_mapping_changed();
    });
    presets.appendChild(md_element('span', { class: 'md-insp-note' }, 'Presets:'));
    presets.appendChild(mode_btn);
    presets.appendChild(tt_btn);
    presets.appendChild(pause_btn);
    output_set.appendChild(presets);
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

    render_key_features(m, body);

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
    render_board_settings();
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
        note.innerText = "This board's firmware doesn't have profiles yet. Flash the latest TrueMap firmware to use them.";
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

// ---------------------------------------------------------------------------
// Live test tab: a picture of the device the board pretends to be, lit by what
// the mappings on this page send, and a log of inputs as the board reports them.

const LIVE_DEVICES = {
    powermic2: {
        name: 'PowerMic II',
        rows: [
            [['Transcribe', '0xff010001']],
            [['◂ Prev field', '0xff010002'], ['Next field ▸', '0xff010004']],
            [['● Dictate', '0xff010003', 'rec']],
            [['Rewind', '0xff010005'], ['Stop / Play', '0xff010007'], ['Fast fwd', '0xff010006']],
            [['Custom L', '0xff010008'], ['Enter', '0xff010009'], ['Custom R', '0xff01000a']],
        ],
    },
    powermic4: {
        name: 'PowerMic 4',
        rows: [
            [['Fn A', '0xff03000a'], ['Fn B', '0xff03000b']],
            [['◂ Tab back', '0xff030005'], ['Tab fwd ▸', '0xff030004']],
            [['● Dictate', '0xff030001', 'rec']],
            [['Rewind', '0xff030006'], ['Play / Pause', '0xff030003'], ['Forward', '0xff030007']],
            [['Fn C', '0xff03000c'], ['Enter', '0xff030008'], ['Fn D', '0xff03000d']],
        ],
    },
    speechmike: {
        name: 'SpeechMike Premium',
        rows: [
            [['EOL/PRIO', '0xff040006'], ['INS/OVR', '0xff040007']],
            [['● Record', '0xff040001', 'rec']],
            [['Rewind', '0xff040005'], ['Play / Stop', '0xff040003'], ['Forward', '0xff040004']],
            [['F1', '0xff04000a'], ['F2', '0xff04000b'], ['F3', '0xff04000c'], ['F4', '0xff04000d']],
            [['Command', '0xff04000e']],
        ],
    },
    pedal: {
        name: 'Foot pedal',
        rows: [[['Left', '0xff020001', 'ped'], ['Middle', '0xff020002', 'ped'], ['Right', '0xff020003', 'ped']]],
    },
};

const DESCRIPTOR_NAMES = {
    0: 'Mouse and keyboard', 1: 'Absolute mouse and keyboard', 2: 'Switch gamepad', 3: 'PS4 arcade stick',
    4: 'Stadia controller', 5: 'XAC/Flex compatible', 6: 'PowerMic II (no microphone)', 7: 'Foot pedal',
    8: 'PowerMic II with microphone', 9: 'PowerMic 4', 10: 'SpeechMike Premium',
};

function live_device_id() {
    const n = parseInt(config['our_descriptor_number']);
    return (n == 6 || n == 8) ? 'powermic2' : n == 9 ? 'powermic4' : n == 10 ? 'speechmike' : n == 7 ? 'pedal' : null;
}

function render_live_device() {
    const box = document.getElementById('live_device');
    const id = live_device_id();
    document.getElementById('live_type').innerText = 'Board is set to: ' + (DESCRIPTOR_NAMES[config['our_descriptor_number']] || 'type ' + config['our_descriptor_number']);
    if (box.dataset.device === String(id)) {
        return;
    }
    box.dataset.device = String(id);
    clear_children(box);
    const note = document.getElementById('live_device_note');
    if (!id) {
        box.className = 'md-live-none';
        box.appendChild(md_element('p', {}, 'This type sends ordinary keyboard, mouse or gamepad input, so there\'s no button picture. What each press sends is in the log.'));
        note.innerText = '';
        return;
    }
    const d = LIVE_DEVICES[id];
    box.className = id == 'pedal' ? 'md-live-pedal' : 'md-live-mic';
    if (id != 'pedal') {
        box.appendChild(md_element('div', { class: 'md-live-grille', 'aria-hidden': 'true' }));
    }
    for (const row of d.rows) {
        const r = md_element('div', { class: 'md-live-row' });
        for (const [label, usage, cls] of row) {
            const b = md_element('div', { class: 'md-pb' + (cls ? ' ' + cls : '') }, label);
            b.dataset.target = usage;
            r.appendChild(b);
        }
        box.appendChild(r);
    }
    note.innerText = d.name + ' · button map simplified, not to scale';
}

function live_port_ok(m, hub_port) {
    const p = m['source_port'] || 0;
    return p == 0 || p == hub_port;
}

// what the mappings on this page make of one input: [{ text, target }]
function live_resolve(usage, hub_port) {
    const out = [];
    for (const m of config['mappings']) {
        if (m['source_usage'] == usage && live_port_ok(m, hub_port) && m['target_usage'] != '0x00000000') {
            const layers = m['layers'] || [0];
            const on = layers.length == 1 && layers[0] == 0 ? '' : ' (layer ' + layers.join(', ') + ')';
            out.push({ text: readable_target_usage_name(m['target_usage']) + on, target: m['target_usage'] });
        } else if (m['source_usage'] == usage && live_port_ok(m, hub_port)) {
            out.push({ text: 'blocked (mapped to Nothing)', target: null });
        }
    }
    // inputs read by expressions: name the expression and what it's mapped to
    config['expressions'].forEach((e, i) => {
        if (i >= device_nexpressions() || !e || !e.includes(usage)) {
            return;
        }
        const eu = '0xfff3' + (i + 1).toString(16).padStart(4, '0');
        const x = xcombo_parse(e);
        if (x && (x.a == usage || x.b == usage)) {
            const reg = '0xfff5' + (x.a == usage ? x.ra : x.rb).toString(16).padStart(4, '0');
            const other = readable_usage_name(x.a == usage ? x.b : x.a);
            for (const m of config['mappings'].filter((m) => m['source_usage'] == reg && m['target_usage'] != '0x00000000')) {
                out.push({ text: readable_target_usage_name(m['target_usage']) + ' (alone)', target: m['target_usage'] });
            }
            for (const m of config['mappings'].filter((m) => m['source_usage'] == eu && m['target_usage'] != '0x00000000')) {
                out.push({ text: readable_target_usage_name(m['target_usage']) + ' (with ' + other + ')', target: null });
            }
            return;
        }
        const targets = config['mappings'].filter((m) => m['source_usage'] == eu && m['target_usage'] != '0x00000000');
        if (targets.length) {
            for (const m of targets) {
                out.push({ text: readable_target_usage_name(m['target_usage']) + ' (via Expression ' + (i + 1) + ')', target: m['target_usage'] });
            }
        } else {
            out.push({ text: 'read by Expression ' + (i + 1), target: null });
        }
    });
    // a button taken over by an exclusive combo is mapped to Nothing on purpose
    if (out.some((r) => /\((alone|with )/.test(r.text))) {
        return out.filter((r) => !r.text.startsWith('blocked'));
    }
    return out;
}

const LIVE_AXES = new Set(['0x00010030', '0x00010031', '0x00010032', '0x00010035', '0x00010036', '0x00010037', '0x00010038', '0x000c0238']);
const live_lit = {};
let live_count = 0;

function live_light(target, on, fade) {
    document.querySelectorAll('#live_device .md-pb[data-target="' + target + '"]').forEach((b) => {
        clearTimeout(b._t);
        b.classList.toggle('hit', on);
        if (on && fade) {
            b._t = setTimeout(() => b.classList.remove('hit'), 350);
        }
    });
}

function live_hit(usage, value, hub_port) {
    const pane = document.getElementById('nav-live');
    if (!pane || !pane.classList.contains('active')) {
        return;
    }
    const port = (hub_port == HUB_PORT_NONE) ? 0 : hub_port;
    const axis = LIVE_AXES.has(usage);
    const resolved = live_resolve(usage, port);
    for (const r of resolved) {
        if (r.target) {
            live_light(r.target, value != 0, axis);
        }
    }
    const log = document.getElementById('live_log');
    document.getElementById('live_empty').classList.add('d-none');
    const now = new Date();
    const t = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    let sent;
    if (resolved.length) {
        sent = (!axis && value == 0) ? resolved.map((r) => r.text).join(', ') + ' released' : resolved.map((r) => r.text).join(', ');
    } else {
        const page = usage.slice(0, 6);
        const passes = ['0x0007', '0x0009', '0x0001', '0x000c'].includes(page) && (config['unmapped_passthrough_layers'] || []).length;
        sent = passes ? 'not mapped · passed through as is' : 'nothing (not mapped)';
    }
    const top = log.firstElementChild;
    // movement (mouse, wheels, knobs) updates one row instead of filling the log
    if (axis && top && top.dataset.key == usage + '_' + port && (Date.now() - top._at) < 600) {
        top.querySelector('.st').innerText = value;
        top.querySelector('.raw').innerText = usage + ' = ' + value;
        top.querySelector('.tm').innerText = t;
        top._at = Date.now();
        return;
    }
    if (top) {
        top.classList.remove('new');
    }
    const row = md_element('div', { class: 'md-ev new' });
    row.dataset.key = usage + '_' + port;
    row._at = Date.now();
    row.appendChild(md_element('span', { class: 'tm' }, t));
    const input = md_element('span', {});
    input.appendChild(md_element('strong', {}, readable_usage_name(usage)));
    input.appendChild(document.createTextNode(' '));
    input.appendChild(md_element('span', { class: 'st' }, axis ? String(value) : (value ? 'down' : 'up')));
    row.appendChild(input);
    const out = md_element('span', { class: 'out' });
    out.appendChild(md_element('span', {}, sent));
    out.appendChild(md_element('span', { class: 'raw' }, usage + ' = ' + value));
    row.appendChild(out);
    row.appendChild(md_element('span', { class: 'pt' }, port == 0 ? '–' : String(port)));
    log.insertBefore(row, log.firstChild);
    while (log.children.length > 200) {
        log.lastElementChild.remove();
    }
    live_count++;
}

function live_setup() {
    const tab = document.getElementById('nav-live-tab');
    tab.addEventListener('shown.bs.tab', async () => {
        render_live_device();
        try {
            await set_monitor_enabled(true);
        } catch (e) {
            display_error(e);
        }
    });
    tab.addEventListener('hide.bs.tab', async () => {
        try {
            await set_monitor_enabled(document.getElementById('kb_live').checked);
        } catch (e) {
            display_error(e);
        }
    });
    document.getElementById('live_clear').addEventListener('click', () => {
        clear_children(document.getElementById('live_log'));
        document.getElementById('live_empty').classList.remove('d-none');
        document.querySelectorAll('#live_device .md-pb.hit').forEach((b) => b.classList.remove('hit'));
    });
    const raw = document.getElementById('live_raw');
    const apply_raw = () => {
        document.getElementById('live_log').classList.toggle('no-raw', !raw.checked);
        document.getElementById('live_raw_section').classList.toggle('d-none', !raw.checked);
    };
    raw.addEventListener('change', apply_raw);
    apply_raw();
    render_live_device();
}

// ---------------------------------------------------------------------------
// Board settings (top of the Settings tab): the device type as tiles, what is
// known about the board, the two everyday switches, and restart / clean-up.

const BOARD_TYPES = [
    { name: 'PowerMic II', desc: 'PowerScribe One. Buttons, plus a silent microphone so Windows sees a recording device.', id: '0554:1001', types: [8, 6], set: 8 },
    { name: 'PowerMic 4', desc: 'Newer PowerScribe One installs that expect a PowerMic 4.', id: '0554:0064', types: [9], set: 9 },
    { name: 'SpeechMike Premium', desc: 'Philips SpeechMike Premium SMP3700 (PowerScribe One 2023.1 SP3 or later).', id: '0911:0C1C', types: [10], set: 10 },
    { name: 'Foot pedal', desc: 'Three-pedal transcription foot pedal (left, middle, right).', id: '05F3:00FF', types: [7], set: 7 },
    { name: 'Standard HID Remapper', desc: 'Plain keyboard and mouse. No PowerScribe buttons.', id: 'CAFE:BAF2', types: [0], set: 0 },
];

function board_type_label(n) {
    return DESCRIPTOR_NAMES[n] || ('type ' + n);
}

function render_board_settings() {
    const tiles = document.getElementById('board_types');
    if (!tiles) {
        return;
    }
    const n = parseInt(config['our_descriptor_number']);
    clear_children(tiles);
    for (const t of BOARD_TYPES) {
        const on = t.types.includes(n);
        const b = md_element('button', { type: 'button', class: 'md-tile' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false' });
        b.appendChild(md_element('span', { class: 'n' }, t.name));
        b.appendChild(md_element('span', { class: 'd' }, t.desc));
        b.appendChild(md_element('span', { class: 'i' }, t.id));
        b.addEventListener('click', () => board_set_type(t.types.includes(n) ? n : t.set));
        tiles.appendChild(b);
    }
    // facts
    const facts = document.getElementById('board_facts');
    clear_children(facts);
    const active = profiles.find((p) => p.active);
    const devices = Object.entries(port_devices()).filter(([, id]) => id in DEVICES)
        .map(([port, id]) => DEVICES[id].name + ' · ' + port_name(port).toLowerCase());
    const add = (label, value, mono = false) => {
        const f = md_element('div', { class: 'md-fact' });
        f.appendChild(md_element('span', { class: 'l' }, label));
        f.appendChild(md_element('span', { class: 'v' + (mono ? ' mono' : '') }, value));
        facts.appendChild(f);
    };
    add('Board', device == null ? 'Not open' : (running_device_type != null ? 'Running as ' + board_type_label(running_device_type) : 'Open'));
    add('Settings version', device == null ? '–' : (device_version >= 20 ? 'v' + device_version + ' (profiles, combos, tap dance, auto-scroll)' : device_version >= 19 ? 'v' + device_version + ' (profiles, 12 expressions; update for tap dance and auto-scroll)' : 'v' + device_version + ' (older firmware)'), false);
    add('Profile in use', active ? (active.name || 'Profile ' + (active.slot + 1)) : '–');
    if (board_info.version) {
        add('Firmware', board_info.version, true);
    }
    if (board_info.name) {
        add('Board name', board_info.name);
    }
    add('Devices on ports', devices.length ? devices.join(', ') : 'none set (Mappings tab)');
    // switches
    const pt = document.getElementById('board_passthrough');
    const layers = config['unmapped_passthrough_layers'] || [];
    pt.checked = layers.length > 0;
    pt.indeterminate = layers.length > 0 && layers.length < 8;
    document.getElementById('board_erase').disabled = device == null || !device_has_profiles();
    document.getElementById('board_bootsel').disabled = device == null;
    document.getElementById('board_save').disabled = device == null;
    render_board_v21();
    // what saving would change
    const change = document.getElementById('board_change');
    if (device != null && running_device_type != null && running_device_type != n) {
        change.innerText = 'Device type changes from ' + board_type_label(running_device_type) + ' to ' + board_type_label(n) + '. The board restarts when you save.';
    } else {
        change.innerText = device == null ? 'Open the board to save.' : '';
    }
}

function board_set_type(n) {
    const before = parseInt(config['our_descriptor_number']);
    config['our_descriptor_number'] = n;
    offer_target_substitution(before, n);
    document.getElementById('our_descriptor_number_dropdown').value = String(n);
    set_ui_state();
    render_live_device();
    render_board_settings();
}

function board_setup() {
    document.getElementById('board_passthrough').addEventListener('change', (e) => {
        config['unmapped_passthrough_layers'] = e.target.checked ? [0, 1, 2, 3, 4, 5, 6, 7] : [];
        set_ui_state();
        render_board_settings();
    });
    document.getElementById('board_bootsel').addEventListener('click', () => document.getElementById('flash_firmware').click());
    document.getElementById('board_save').addEventListener('click', () => document.getElementById('save_to_device').click());
    document.getElementById('board_erase').addEventListener('click', () => profile_action(async () => {
        const others = profiles.filter((p) => p.saved && !p.active);
        if (!others.length) {
            alert('There are no other profiles on the board.');
            return;
        }
        if (!confirm('Delete ' + others.length + ' profile(s) from the board: ' + others.map((p) => p.name || 'Profile ' + (p.slot + 1)).join(', ') + '? The profile in use stays.')) {
            return;
        }
        for (const p of others) {
            await profile_command(PROFILE_DELETE, p.slot);
        }
        await refresh_profiles();
    }));
    document.getElementById('nav-settings-tab').addEventListener('shown.bs.tab', render_board_settings);
    render_board_settings();
}


// ---------------------------------------------------------------------------
// Combos: two buttons pressed together do something of their own. Made as an
// expression "P port A input_state_binary B input_state_binary mul 0 port" (true
// only while both are held) and a mapping from that expression.

const COMBO_RE = /^(\d+) port (0x[0-9a-f]{8}) input_state_binary (0x[0-9a-f]{8}) input_state_binary mul 0 port$/i;
let combo_state = null;  // { picks: [usage...], port, monitor_was_on }

function combo_text(a, b, port) {
    return (port * 1000) + ' port ' + a + ' input_state_binary ' + b + ' input_state_binary mul 0 port';
}

// { a, b, port, label } when the usage is an expression made as a combo
function combo_of_usage(usage) {
    if (typeof usage != 'string' || typeof config == 'undefined') {
        return null;
    }
    usage = usage.toLowerCase();
    if (usage.startsWith('0xfff5')) {
        // a register written by an exclusive combo: "A (alone)"
        const reg = parseInt(usage, 16) & 0xFFFF;
        for (const x of xcombos()) {
            if (reg == x.ra || reg == x.rb) {
                const u = reg == x.ra ? x.a : x.b;
                return { a: x.a, b: x.b, port: x.port, alone: u, label: readable_usage_name(u) + ' alone' + (x.port ? ' (port ' + x.port + ')' : '') };
            }
        }
        return null;
    }
    if (!usage.startsWith('0xfff3')) {
        return null;
    }
    const i = (parseInt(usage, 16) & 0xFFFF) - 1;
    const x = xcombo_parse((config['expressions'] || [])[i]);
    if (x) {
        return { a: x.a, b: x.b, port: x.port, label: readable_usage_name(x.a) + ' + ' + readable_usage_name(x.b) + ' only' + (x.port ? ' (port ' + x.port + ')' : '') };
    }
    const m = COMBO_RE.exec(expr_norm((config['expressions'] || [])[i]));
    if (!m) {
        return null;
    }
    const port = parseInt(m[1]) / 1000;
    const a = m[2].toLowerCase(), b = m[3].toLowerCase();
    return { a, b, port, label: readable_usage_name(a) + ' + ' + readable_usage_name(b) + (port ? ' (port ' + port + ')' : '') };
}

function combo_show() {
    const bar = document.getElementById('combo_bar');
    document.getElementById('combo_start').classList.toggle('d-none', !!combo_state);
    bar.classList.toggle('d-none', !combo_state);
    document.getElementById('kb_card').classList.toggle('md-combo-on', !!combo_state);
    if (!combo_state) {
        document.querySelectorAll('#kb_picture .combo-pick, #kb_other .combo-pick').forEach((k) => k.classList.remove('combo-pick'));
        return;
    }
    const where = combo_state.port ? 'port ' + combo_state.port : 'any port';
    const live = device != null ? ' (or press it on the device)' : '';
    const many = device_has_extras();
    document.getElementById('combo_done').classList.toggle('d-none', !many || combo_state.picks.length < 2);
    document.getElementById('combo_text').innerText = combo_state.picks.length == 0
        ? 'Combo on ' + where + ': click the first button on the picture' + live + '.'
        : many
            ? combo_state.picks.map((u) => readable_usage_name(u)).join(' + ') + (combo_state.picks.length < 2 ? '. Now the second button' + live + '.' : '. Add another (up to 4), or click Done.')
            : 'First: ' + readable_usage_name(combo_state.picks[0]) + '. Now the second button' + live + '.';
    document.querySelectorAll('#kb_picture .md-key[data-usage], #kb_other .md-chip[data-usage]').forEach((k) => {
        k.classList.toggle('combo-pick', combo_state.picks.includes(k.dataset.usage));
    });
}

async function combo_start() {
    combo_state = { picks: [], port: parseInt(current_port), monitor_was_on: monitor_enabled };
    combo_show();
    if (device != null && !monitor_enabled) {
        try {
            await set_monitor_enabled(true);
        } catch (e) {
            display_error(e);
        }
    }
}

async function combo_end() {
    const was_on = combo_state ? combo_state.monitor_was_on : true;
    combo_state = null;
    combo_show();
    if (!was_on && device != null) {
        try {
            await set_monitor_enabled(document.getElementById('kb_live').checked);
        } catch (e) {
            display_error(e);
        }
    }
}

// a press on the real device while picking
function combo_hit(usage, value, hub_port) {
    if (!combo_state || value == 0 || LIVE_AXES.has(usage)) {
        return;
    }
    if (combo_state.port && hub_port != combo_state.port) {
        // a press from another port (or the board's own pins) can't be part of this port's combo
        document.getElementById('combo_text').innerText = readable_usage_name(usage) + ' came from ' +
            (hub_port && hub_port != HUB_PORT_NONE ? 'port ' + hub_port : 'the board itself') + '. Cancel and pick that port (or Any port) to use it.';
        return;
    }
    combo_pick(usage);
}

function combo_pick(usage) {
    usage = usage.toLowerCase();
    if (combo_state.picks.includes(usage)) {
        return;
    }
    combo_state.picks.push(usage);
    if (device_has_extras()) {
        if (combo_state.picks.length < X_MAX.combo_keys) {
            combo_show();
            return;
        }
        combo_finish();
        return;
    }
    if (combo_state.picks.length < 2) {
        combo_show();
        return;
    }
    const [a, b] = combo_state.picks;
    const port = combo_state.port;
    const n = device_nexpressions();
    if (document.getElementById('combo_exclusive').checked) {
        combo_make_exclusive(a, b, port);
        return;
    }
    // the same pair in either order is the same combo
    let i = config['expressions'].findIndex((e, k) => k < n && [combo_text(a, b, port), combo_text(b, a, port)].map(expr_norm).includes(expr_norm(e)));
    if (i < 0) {
        i = config['expressions'].findIndex((e, k) => k < n && expr_norm(e) == '');
    }
    if (i < 0) {
        alert('All ' + n + ' expressions are in use. Clear one on the Expressions tab first.');
        combo_end();
        return;
    }
    config['expressions'][i] = combo_text(a, b, port);
    set_expressions_ui_state();
    const usage_e = '0xfff3' + (i + 1).toString(16).padStart(4, '0');
    let mapping = config['mappings'].find((m) => m['source_usage'] == usage_e);
    if (!mapping) {
        add_empty_mapping(usage_e);
        mapping = config['mappings'][config['mappings'].length - 1];
    }
    combo_end();
    set_mappings_ui_state();
    md_select(mapping, true);
}

// settings v20: the board does combos itself
function combo_finish() {
    if (!combo_state || combo_state.picks.length < 2) {
        return;
    }
    const mapping = extras_add_combo(combo_state.picks, combo_state.port, document.getElementById('combo_exclusive').checked);
    combo_end();
    if (mapping) {
        set_mappings_ui_state();
        md_select(mapping, true);
    }
}

function combo_setup() {
    document.getElementById('combo_done').addEventListener('click', combo_finish);
    document.getElementById('combo_start').addEventListener('click', combo_start);
    document.getElementById('combo_cancel').addEventListener('click', combo_end);
    document.addEventListener('keydown', (e) => {
        if (combo_state && e.key == 'Escape') {
            combo_end();
        }
    });
}

// ---------------------------------------------------------------------------
// Clear all mappings (Mappings tab)

function clear_all_mappings() {
    const n = config['mappings'].length;
    if (n == 0) {
        return;
    }
    if (!confirm('Delete all ' + n + ' mapping' + (n == 1 ? '' : 's') + ' on this page? Nothing changes on the board until you click Save to device.')) {
        return;
    }
    config['mappings'] = [];
    selected_mapping = null;
    set_mappings_ui_state();
    md_refresh();
}

// ---------------------------------------------------------------------------
// Macro builder (Macros tab): build a macro from typed text, a recorded key
// sequence, shortcuts and pauses, instead of picking every key by hand. It
// edits config['macros'] and redraws the detailed list below it.

const MB_MAX_STEPS = 255;  // the board stores a macro's step count in one byte
const MB_SHIFT = '0x000700e1';
const MB_MODS = ['0x000700e0', '0x000700e1', '0x000700e2', '0x000700e3', '0x000700e4', '0x000700e5', '0x000700e6', '0x000700e7'];
const kbu = (n) => '0x000700' + n.toString(16).padStart(2, '0');

// US layout: character -> [usage, shift]
const MB_CHARS = (() => {
    const m = {};
    for (let i = 0; i < 26; i++) {
        m[String.fromCharCode(97 + i)] = [kbu(4 + i), false];
        m[String.fromCharCode(65 + i)] = [kbu(4 + i), true];
    }
    '1234567890'.split('').forEach((c, i) => m[c] = [kbu(0x1e + i), false]);
    '!@#$%^&*()'.split('').forEach((c, i) => m[c] = [kbu(0x1e + i), true]);
    const plain = { ' ': 0x2c, '\n': 0x28, '\t': 0x2b, '-': 0x2d, '=': 0x2e, '[': 0x2f, ']': 0x30, '\\': 0x31, ';': 0x33, "'": 0x34, '`': 0x35, ',': 0x36, '.': 0x37, '/': 0x38 };
    const shifted = { '_': 0x2d, '+': 0x2e, '{': 0x2f, '}': 0x30, '|': 0x31, ':': 0x33, '"': 0x34, '~': 0x35, '<': 0x36, '>': 0x37, '?': 0x38 };
    for (const [c, u] of Object.entries(plain)) m[c] = [kbu(u), false];
    for (const [c, u] of Object.entries(shifted)) m[c] = [kbu(u), true];
    return m;
})();
const MB_CHAR_OF = (() => {
    const r = {};
    for (const [c, [u, sh]] of Object.entries(MB_CHARS)) {
        r[u + (sh ? '+s' : '')] = c;
    }
    return r;
})();

// KeyboardEvent.code -> HID usage
const MB_CODES = (() => {
    const m = {};
    for (let i = 0; i < 26; i++) m['Key' + String.fromCharCode(65 + i)] = kbu(4 + i);
    for (let i = 1; i <= 9; i++) m['Digit' + i] = kbu(0x1d + i);
    m['Digit0'] = kbu(0x27);
    Object.assign(m, {
        Enter: kbu(0x28), Escape: kbu(0x29), Backspace: kbu(0x2a), Tab: kbu(0x2b), Space: kbu(0x2c), Minus: kbu(0x2d), Equal: kbu(0x2e),
        BracketLeft: kbu(0x2f), BracketRight: kbu(0x30), Backslash: kbu(0x31), Semicolon: kbu(0x33), Quote: kbu(0x34), Backquote: kbu(0x35),
        Comma: kbu(0x36), Period: kbu(0x37), Slash: kbu(0x38), CapsLock: kbu(0x39), PrintScreen: kbu(0x46), ScrollLock: kbu(0x47), Pause: kbu(0x48),
        Insert: kbu(0x49), Home: kbu(0x4a), PageUp: kbu(0x4b), Delete: kbu(0x4c), End: kbu(0x4d), PageDown: kbu(0x4e),
        ArrowRight: kbu(0x4f), ArrowLeft: kbu(0x50), ArrowDown: kbu(0x51), ArrowUp: kbu(0x52), NumLock: kbu(0x53),
        NumpadDivide: kbu(0x54), NumpadMultiply: kbu(0x55), NumpadSubtract: kbu(0x56), NumpadAdd: kbu(0x57), NumpadEnter: kbu(0x58),
        NumpadDecimal: kbu(0x63), IntlBackslash: kbu(0x64), ContextMenu: kbu(0x65),
        ControlLeft: kbu(0xe0), ShiftLeft: kbu(0xe1), AltLeft: kbu(0xe2), MetaLeft: kbu(0xe3),
        ControlRight: kbu(0xe4), ShiftRight: kbu(0xe5), AltRight: kbu(0xe6), MetaRight: kbu(0xe7),
    });
    for (let i = 1; i <= 9; i++) m['Numpad' + i] = kbu(0x58 + i);
    m['Numpad0'] = kbu(0x62);
    for (let i = 1; i <= 12; i++) m['F' + i] = kbu(0x39 + i);
    for (let i = 13; i <= 24; i++) m['F' + i] = kbu(0x5b + i);
    return m;
})();

let mb_slot = 0;
let mb_capture = null;  // null | 'combo' | 'record'

function mb_steps() {
    while (config['macros'].length < NMACROS) {
        config['macros'].push([]);
    }
    return config['macros'][mb_slot];
}

function mb_step_ms() {
    return parseInt(config['macro_entry_duration']) || 1;
}

// append steps, adding a release between two steps that share a key (otherwise
// the key would just stay down and type once)
function mb_append(steps) {
    const macro = mb_steps();
    for (const step of steps) {
        const last = macro.length ? macro[macro.length - 1] : [];
        if (step.length && last.some((u) => step.includes(u) && !MB_MODS.includes(u))) {
            macro.push([]);
        }
        macro.push(step);
    }
    mb_changed();
}

function mb_text_steps(text) {
    const steps = [];
    const skipped = new Set();
    for (const c of text.replace(/\r\n?/g, '\n')) {
        const k = MB_CHARS[c];
        if (!k) {
            skipped.add(c);
            continue;
        }
        steps.push(k[1] ? [MB_SHIFT, k[0]] : [k[0]]);
    }
    return { steps, skipped };
}

function mb_changed() {
    set_macros_ui_state();
    mb_render();
}

// how many bytes the saved settings take on the board (same sum as the firmware's
// check; the limit is 4096)
function config_storage_bytes() {
    let n = 19 + 4;
    n += (config['mappings'].length + port_device_mappings().length) * 15;
    for (const macro of config['macros']) {
        n += 1;
        for (const entry of macro) {
            n += 1 + 4 * entry.length;
        }
    }
    for (const e of config['expressions'] || []) {
        n += 2;
        for (const tok of (e || '').trim().split(/\s+/).filter((t) => t)) {
            n += 1 + (/^(0x[0-9a-f]+|-?\d+)$/i.test(tok) ? 4 : 0);
        }
    }
    n += (config['quirks'] || []).length * 14;
    if (device_has_extras()) {
        n += extras_storage_bytes();
    }
    return n;
}

// group the steps for display: typed text, pauses, other steps
function mb_groups(macro) {
    const groups = [];
    for (let i = 0; i < macro.length; i++) {
        const step = macro[i];
        const last = groups[groups.length - 1];
        if (step.length == 0) {
            // a release between two presses of one key belongs to the text around it
            const prev = macro[i - 1] || [], next = macro[i + 1] || [];
            const between_text = last && last.type == 'text' && prev.some((u) => next.includes(u) && !MB_MODS.includes(u));
            if (between_text) {
                last.steps.push(step);
                continue;
            }
            if (last && last.type == 'pause') {
                last.steps.push(step);
            } else {
                groups.push({ type: 'pause', steps: [step] });
            }
            continue;
        }
        const key = step.length == 1 ? step[0] : (step.length == 2 && step[0] == MB_SHIFT ? step[1] + '+s' : null);
        const c = key ? MB_CHAR_OF[key] : undefined;
        if (c !== undefined) {
            if (last && last.type == 'text') {
                last.steps.push(step);
                last.text += c;
            } else {
                groups.push({ type: 'text', steps: [step], text: c });
            }
            continue;
        }
        groups.push({ type: 'step', steps: [step] });
    }
    return groups;
}

function mb_step_label(step) {
    const short = (u) => readable_target_usage_name(u).replace(/^Left |^Right /, '').replace('Control', 'Ctrl');
    const mods = step.filter((u) => MB_MODS.includes(u)).map(short);
    const rest = step.filter((u) => !MB_MODS.includes(u)).map(short);
    return mods.concat(rest).join('+');
}

function mb_render() {
    const box = document.getElementById('mb_steps');
    if (!box) {
        return;
    }
    // slot list with previews
    const sel = document.getElementById('mb_slot');
    const prev = sel.value;
    clear_children(sel);
    for (let i = 0; i < NMACROS; i++) {
        const m = config['macros'][i] || [];
        const preview = m.length ? mb_groups(m).map((g) => g.type == 'text' ? g.text.replace(/\n/g, '⏎') : g.type == 'pause' ? '⏸' : mb_step_label(g.steps[0])).join(' ').slice(0, 30) : 'empty';
        const name = ((config['extras'] || {})['macro_names'] || {})[i];
        sel.appendChild(md_element('option', { value: String(i) }, 'Macro ' + (i + 1) + (name ? ': ' + name : '') + ' — ' + preview));
    }
    sel.value = String(mb_slot);
    const name_in = document.getElementById('mb_name');
    if (name_in && document.activeElement !== name_in) {
        name_in.value = (extras().macro_names || {})[mb_slot] || '';
    }
    const rep_on = document.getElementById('mb_repeat');
    if (rep_on) {
        const r = (x21().macro_repeats || {})[mb_slot];
        rep_on.checked = !!r;
        document.getElementById('mb_repeat_delay').value = r ? r.delay_ms : 400;
        document.getElementById('mb_repeat_rate').value = r ? r.rate_ms : 100;
        document.getElementById('mb_repeat_opts').classList.toggle('d-none', !r);
    }
    clear_children(box);
    const macro = mb_steps();
    const groups = mb_groups(macro);
    if (!groups.length) {
        box.appendChild(md_element('span', { class: 'md-mb-empty' }, 'No steps yet. Type text, record keys or add a shortcut below.'));
    }
    groups.forEach((g, gi) => {
        const chip = md_element('span', { class: 'md-mb-chip ' + g.type });
        let label;
        if (g.type == 'text') {
            label = '“' + g.text.replace(/\n/g, '⏎').replace(/\t/g, '⇥') + '”';
        } else if (g.type == 'pause') {
            label = '⏸ ' + (g.steps.length * mb_step_ms()) + ' ms';
        } else {
            label = mb_step_label(g.steps[0]);
        }
        chip.appendChild(md_element('span', { class: 'l' }, label));
        const move = (d) => {
            const j = gi + d;
            if (j < 0 || j >= groups.length) {
                return;
            }
            [groups[gi], groups[j]] = [groups[j], groups[gi]];
            config['macros'][mb_slot] = [];
            mb_append(groups.flatMap((x) => x.steps));
        };
        const b_left = md_element('button', { type: 'button', class: 'x', 'aria-label': 'Move ' + label + ' earlier' }, '‹');
        b_left.addEventListener('click', () => move(-1));
        const b_right = md_element('button', { type: 'button', class: 'x', 'aria-label': 'Move ' + label + ' later' }, '›');
        b_right.addEventListener('click', () => move(1));
        const b_del = md_element('button', { type: 'button', class: 'x', 'aria-label': 'Remove ' + label }, '×');
        b_del.addEventListener('click', () => {
            groups.splice(gi, 1);
            config['macros'][mb_slot] = [];
            mb_append(groups.flatMap((x) => x.steps));
        });
        if (gi > 0) chip.appendChild(b_left);
        if (gi < groups.length - 1) chip.appendChild(b_right);
        chip.appendChild(b_del);
        box.appendChild(chip);
    });
    // limits
    const bytes = config_storage_bytes();
    const st = document.getElementById('mb_storage');
    const over_steps = macro.length > MB_MAX_STEPS;
    st.innerText = macro.length + ' of ' + MB_MAX_STEPS + ' steps · plays in about ' + Math.max(1, Math.round(macro.length * mb_step_ms())) + ' ms · board storage ' + bytes + ' of 4096 bytes';
    st.classList.toggle('over', over_steps || bytes > 4096);
    if (over_steps) {
        st.innerText += ' — too many steps, shorten it';
    } else if (bytes > 4096) {
        st.innerText += ' — too much to save, shorten something';
    }
    const speed = document.getElementById('mb_speed');
    if (document.activeElement !== speed) {
        speed.value = mb_step_ms();
    }
    document.getElementById('mb_use').disabled = macro.length == 0;
    document.getElementById('mb_clear').disabled = macro.length == 0;
}

function mb_capture_set(mode) {
    mb_capture = mode;
    const combo = document.getElementById('mb_combo');
    const rec = document.getElementById('mb_record');
    combo.innerText = mode == 'combo' ? 'Press the keys now… (Esc cancels)' : 'Press a shortcut…';
    rec.innerText = mode == 'record' ? '■ Stop recording' : '● Record keys';
    combo.classList.toggle('active', mode == 'combo');
    rec.classList.toggle('active', mode == 'record');
    document.getElementById('nav-macros').classList.toggle('md-mb-capturing', !!mode);
}

const mb_held = new Set();
let mb_mod_tap = null;

function mb_keydown(e) {
    if (!mb_capture) {
        return;
    }
    const u = MB_CODES[e.code];
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) {
        return;
    }
    if (mb_capture == 'combo' && e.code == 'Escape' && mb_held.size == 0) {
        mb_capture_set(null);
        return;
    }
    if (!u) {
        return;
    }
    mb_held.add(u);
    if (MB_MODS.includes(u)) {
        mb_mod_tap = u;  // a modifier pressed and released alone is a step of its own
        return;
    }
    mb_mod_tap = null;
    const step = MB_MODS.filter((m) => mb_held.has(m)).concat([u]);
    mb_append([step]);
    if (mb_capture == 'combo') {
        mb_held.clear();
        mb_capture_set(null);
    }
}

function mb_keyup(e) {
    if (!mb_capture) {
        mb_held.clear();
        return;
    }
    const u = MB_CODES[e.code];
    e.preventDefault();
    if (u && mb_mod_tap == u && MB_MODS.includes(u)) {
        mb_append([[u]]);
        if (mb_capture == 'combo') {
            mb_capture_set(null);
        }
    }
    mb_mod_tap = null;
    if (u) {
        mb_held.delete(u);
    }
}

function macro_builder_setup() {
    document.getElementById('clear_mappings').addEventListener('click', clear_all_mappings);
    document.getElementById('mb_slot').addEventListener('change', (e) => {
        mb_slot = parseInt(e.target.value);
        mb_render();
    });
    const repeat_changed = () => {
        const on = document.getElementById('mb_repeat').checked;
        const x = x21();
        if (on) {
            x.macro_repeats[mb_slot] = {
                delay_ms: Math.max(50, Math.min(5000, parseInt(document.getElementById('mb_repeat_delay').value) || 400)),
                rate_ms: Math.max(20, Math.min(5000, parseInt(document.getElementById('mb_repeat_rate').value) || 100)),
            };
        } else {
            delete x.macro_repeats[mb_slot];
        }
        mb_render();
    };
    ['mb_repeat', 'mb_repeat_delay', 'mb_repeat_rate'].forEach((id) => document.getElementById(id).addEventListener('change', repeat_changed));
    document.getElementById('mb_name').addEventListener('change', (e) => {
        const name = e.target.value.trim().slice(0, 40);
        if (name) {
            extras().macro_names[mb_slot] = name;
        } else {
            delete extras().macro_names[mb_slot];
        }
        mb_render();
        set_mappings_ui_state();
        md_refresh();
    });
    const add_text = () => {
        const input = document.getElementById('mb_text');
        const { steps, skipped } = mb_text_steps(input.value);
        if (skipped.size) {
            alert('These characters have no key on a US keyboard and were left out: ' + [...skipped].join(' '));
        }
        if (steps.length) {
            mb_append(steps);
            input.value = '';
        }
    };
    document.getElementById('mb_text_add').addEventListener('click', add_text);
    document.getElementById('mb_text').addEventListener('keydown', (e) => {
        if (e.key == 'Enter') {
            e.preventDefault();
            add_text();
        }
    });
    document.querySelectorAll('.mb-add-key').forEach((b) => b.addEventListener('click', () => mb_append([[b.dataset.usage]])));
    document.getElementById('mb_pause').addEventListener('click', () => {
        const ms = Math.max(1, parseInt(document.getElementById('mb_pause_ms').value) || 50);
        if (device == null || device_v21()) {
            // one "wait" step, however long
            let left = ms;
            const steps = [];
            while (left > 0) {
                const n = Math.min(left, 65000);
                steps.push([xu(0xFFE90000 + n)]);
                left -= n;
            }
            mb_append(steps);
            return;
        }
        const n = Math.max(1, Math.round(ms / mb_step_ms()));
        const room = MB_MAX_STEPS - mb_steps().length;
        if (n > room) {
            // a pause is made of empty steps, so it costs ms / step length steps
            alert('A ' + ms + ' ms pause needs ' + n + ' steps at the current step length (' + mb_step_ms() + ' ms), and this macro has room for ' + Math.max(0, room) + '. Make the step length longer (e.g. 10 ms) for long pauses.');
            return;
        }
        mb_append(Array.from({ length: n }, () => []));
    });
    document.getElementById('mb_combo').addEventListener('click', (e) => {
        e.currentTarget.blur();
        mb_capture_set(mb_capture == 'combo' ? null : 'combo');
    });
    document.getElementById('mb_record').addEventListener('click', (e) => {
        e.currentTarget.blur();
        mb_capture_set(mb_capture == 'record' ? null : 'record');
    });
    window.addEventListener('keydown', mb_keydown, true);
    window.addEventListener('keyup', mb_keyup, true);
    // "Any output…": the usual output picker, into a hidden button we watch
    const hidden = md_element('button', { type: 'button', class: 'd-none', 'data-hid-usage': '0x00000000' });
    hidden.appendChild(md_element('span', { class: 'button_label' }));
    document.getElementById('mb_pick').after(hidden);
    new MutationObserver(() => {
        const u = hidden.getAttribute('data-hid-usage');
        if (u && u != '0x00000000') {
            hidden.setAttribute('data-hid-usage', '0x00000000');
            mb_append([[u]]);
        }
    }).observe(hidden, { attributes: true, attributeFilter: ['data-hid-usage'] });
    document.getElementById('mb_pick').addEventListener('click', () => show_usage_modal(null, 'macro_item', hidden)());
    document.getElementById('mb_speed').addEventListener('change', (e) => {
        const input = document.getElementById('macro_entry_duration_input');
        input.value = e.target.value;
        macro_entry_duration_onchange();
        mb_render();
    });
    mb_clip_setup();
    document.getElementById('mb_clear').addEventListener('click', () => {
        if (confirm('Remove all steps from Macro ' + (mb_slot + 1) + '?')) {
            config['macros'][mb_slot] = [];
            mb_changed();
        }
    });
    document.getElementById('mb_use').addEventListener('click', () => {
        const target = '0xfff2' + (mb_slot + 1).toString(16).padStart(4, '0');
        add_empty_mapping();
        const m = config['mappings'][config['mappings'].length - 1];
        m['target_usage'] = target;
        set_mappings_ui_state();
        const tab = document.getElementById('nav-mappings-tab');
        if (window.bootstrap && bootstrap.Tab && bootstrap.Tab.getOrCreateInstance) {
            bootstrap.Tab.getOrCreateInstance(tab).show();
        } else {
            tab.click();
        }
        md_select(m, true);
        const card = document.getElementById('kb_card');
        if (card) {
            card.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
    });
    document.getElementById('nav-macros-tab').addEventListener('hide.bs.tab', () => mb_capture_set(null));
    mb_render();
}


// ---------------------------------------------------------------------------
// Exclusive combos: A + B together do the combo's action only; A or B alone do
// their own action. One expression (its result = "both held") plus five
// registers: RA / RB = "A alone" / "B alone" (what A's and B's own mappings now
// listen to), CA / CB = how many ticks (ms) A / B have been held, L = a combo
// happened and not both are released yet.
//   alone:  held, the other not held, no combo since, held longer than D ms
//   tap:    released before D ms with no combo: one short press
// D (ms) is the window for the second button; the own action starts D ms late.

const XCOMBO_DELAY = 50;

function xcombo_text(a, b, port, r, d = XCOMBO_DELAY) {
    const k = (n) => String(n * 1000);
    const isb = (u) => u + ' input_state_binary';
    const alone = (x, y, cx) =>
        isb(x) + ' ' + isb(y) + ' not mul ' + k(r.l) + ' recall not mul ' + k(cx) + ' recall ' + k(d) + ' gt mul ' +
        x + ' prev_input_state_binary ' + isb(x) + ' not mul ' + k(r.l) + ' recall not mul ' + k(cx) + ' recall ' + k(d) + ' gt not mul max';
    const count = (x, cx) => isb(x) + ' ' + k(cx) + ' recall 1000 add 60000000 min 0 ifte ' + k(cx) + ' store';
    return [
        k(port) + ' port',
        isb(a) + ' ' + isb(b) + ' mul',
        alone(a, b, r.ca) + ' ' + k(r.ra) + ' store',
        alone(b, a, r.cb) + ' ' + k(r.rb) + ' store',
        count(a, r.ca),
        count(b, r.cb),
        isb(a) + ' ' + isb(b) + ' mul 1000 ' + isb(a) + ' ' + isb(b) + ' max ' + k(r.l) + ' recall 0 ifte ifte ' + k(r.l) + ' store',
        '0 port',
    ].join(' ');
}

const XCOMBO_HEAD_RE = /^(\d+) port (0x[0-9a-f]{8}) input_state_binary (0x[0-9a-f]{8}) input_state_binary mul \2 input_state_binary \3 input_state_binary not mul (\d+) recall not mul (\d+) recall (\d+) gt mul/i;

function xcombo_parse(text) {
    const t = expr_norm(text);
    const h = XCOMBO_HEAD_RE.exec(t);
    if (!h) {
        return null;
    }
    const regs = [...t.matchAll(/(\d+) store/g)].map((m) => parseInt(m[1]) / 1000);
    // stores in order: ra, rb, ca, cb, l
    if (regs.length != 5) {
        return null;
    }
    const x = { port: parseInt(h[1]) / 1000, a: h[2].toLowerCase(), b: h[3].toLowerCase(), d: parseInt(h[6]) / 1000,
        r: { ra: regs[0], rb: regs[1], ca: regs[2], cb: regs[3], l: regs[4] } };
    if (expr_norm(xcombo_text(x.a, x.b, x.port, x.r, x.d)) != t) {
        return null;
    }
    return Object.assign(x, { ra: x.r.ra, rb: x.r.rb });
}

function xcombos() {
    return (config['expressions'] || []).map((e, i) => {
        const x = xcombo_parse(e);
        return x ? Object.assign(x, { index: i }) : null;
    }).filter((x) => x);
}

function registers_in_use() {
    const used = new Set();
    for (const e of config['expressions'] || []) {
        for (const m of (e || '').matchAll(/(\d+) (store|recall)/g)) {
            used.add(parseInt(m[1]) / 1000);
        }
    }
    for (const m of config['mappings']) {
        const u = (m['source_usage'] || '').toLowerCase();
        if (u.startsWith('0xfff5')) {
            used.add(parseInt(u, 16) & 0xFFFF);
        }
    }
    return used;
}

// a usage that can also be sent as an output (keys, mouse buttons, consumer keys)
function can_be_output(usage) {
    return usage in usages[config['our_descriptor_number']];
}

function combo_make_exclusive(a, b, port) {
    const n = device_nexpressions();
    // same pair again (either order, same port): reuse it
    const existing = xcombos().find((x) => x.port == port && ((x.a == a && x.b == b) || (x.a == b && x.b == a)));
    let i, r;
    if (existing) {
        i = existing.index;
        r = existing.r;
    } else {
        i = config['expressions'].findIndex((e, k) => k < n && expr_norm(e) == '');
        if (i < 0) {
            alert('All ' + n + ' expressions are in use. Clear one on the Expressions tab first.');
            combo_end();
            return;
        }
        const used = registers_in_use();
        // registers 17-32 are kept for the jog keys (32 - port)
        const free = [];
        for (let k = 1; k <= 16 && free.length < 5; k++) {
            if (!used.has(k)) {
                free.push(k);
            }
        }
        if (free.length < 5) {
            alert('A combo that blocks the buttons needs 5 free registers and only ' + free.length + ' are left (1-16). Remove a combo or an expression that uses registers first.');
            combo_end();
            return;
        }
        r = { ra: free[0], rb: free[1], ca: free[2], cb: free[3], l: free[4] };
        config['expressions'][i] = xcombo_text(a, b, port, r);
    }
    set_expressions_ui_state();
    // the buttons' own mappings on this port now listen to "A alone" / "B alone"
    const reg = (k) => '0xfff5' + k.toString(16).padStart(4, '0');
    const notes = [];
    for (const [u, rk] of [[a, r.ra], [b, r.rb]]) {
        const own = config['mappings'].filter((m) => (m['source_usage'] || '').toLowerCase() == u && (m['source_port'] || 0) == port && m['target_usage'] != '0x00000000');
        for (const m of own) {
            m['source_usage'] = reg(rk);
            m['source_port'] = 0;
        }
        const has_alone = config['mappings'].some((m) => (m['source_usage'] || '').toLowerCase() == reg(rk));
        if (!has_alone && can_be_output(u)) {
            // not mapped before: it passed through as itself, so "alone" sends itself
            add_empty_mapping(reg(rk));
            config['mappings'][config['mappings'].length - 1]['target_usage'] = u;
        }
        // and the button itself sends nothing directly any more
        if (!config['mappings'].some((m) => (m['source_usage'] || '').toLowerCase() == u && (m['source_port'] || 0) == port && m['target_usage'] == '0x00000000')) {
            add_empty_mapping(u);
            config['mappings'][config['mappings'].length - 1]['source_port'] = port;
        }
        if (port != 0 && config['mappings'].some((m) => (m['source_usage'] || '').toLowerCase() == u && (m['source_port'] || 0) == 0 && m['target_usage'] != '0x00000000')) {
            notes.push(readable_usage_name(u) + ' also has an Any-port mapping, which still works on its own.');
        }
    }
    const usage_e = '0xfff3' + (i + 1).toString(16).padStart(4, '0');
    let mapping = config['mappings'].find((m) => m['source_usage'] == usage_e);
    if (!mapping) {
        add_empty_mapping(usage_e);
        mapping = config['mappings'][config['mappings'].length - 1];
    }
    combo_end();
    set_mappings_ui_state();
    md_select(mapping, true);
    if (notes.length) {
        alert(notes.join('\n'));
    }
}


// Undo an exclusive combo: "A alone" mappings go back to A on the combo's port
// (ones the combo added, "A alone -> A", are removed), the "A -> Nothing" blocks
// it added are removed, and its expression is cleared.
function xcombo_undo(x) {
    const reg = (k) => '0xfff5' + k.toString(16).padStart(4, '0');
    const keep = [];
    for (const m of config['mappings']) {
        const u = (m['source_usage'] || '').toLowerCase();
        let drop = false;
        for (const [btn, rk] of [[x.a, x.ra], [x.b, x.rb]]) {
            if (u == reg(rk)) {
                if ((m['target_usage'] || '').toLowerCase() == btn) {
                    drop = true;  // added by the combo: the button passes through again
                } else {
                    m['source_usage'] = btn;
                    m['source_port'] = x.port;
                }
            } else if (u == btn && (m['source_port'] || 0) == x.port && m['target_usage'] == '0x00000000') {
                drop = true;
            }
        }
        if (u == '0xfff3' + (x.index + 1).toString(16).padStart(4, '0')) {
            drop = true;
        }
        if (!drop) {
            keep.push(m);
        }
    }
    config['mappings'] = keep;
    config['expressions'][x.index] = '';
    set_expressions_ui_state();
    set_mappings_ui_state();
    selected_mapping = null;
    md_refresh();
}


// ---------------------------------------------------------------------------
// Device-type substitution: switching between PowerMic II, PowerMic 4,
// SpeechMike and foot pedal offers to move each mapping's output to the new
// device's button for the same PowerScribe job (PowerScribe One defaults; the
// SpeechMike's from Microsoft's "Using Philips SpeechMike 3700" page).

const SUBST_FAMILY = { 6: 'pm2', 8: 'pm2', 9: 'pm4', 10: 'smp', 7: 'pedal' };
const SUBST_TABLE = [
    // job              PowerMic II    PowerMic 4     SpeechMike     foot pedal
    ['Dictate',         '0xff010003', '0xff030001', '0xff040001', '0xff020002'],
    ['Play/Stop',       '0xff010007', '0xff030003', '0xff040003', null],
    ['Previous field',  '0xff010002', '0xff030005', '0xff040005', '0xff020001'],
    ['Next field',      '0xff010004', '0xff030004', '0xff040004', '0xff020003'],
    ['Rewind',          '0xff010005', '0xff030006', null, null],
    ['Fast forward',    '0xff010006', '0xff030007', null, null],
    ['Enter/Select',    '0xff010009', '0xff030008', null, null],
    ['Custom Left',     '0xff010008', '0xff03000a', '0xff04000a', null],
    ['Custom Right',    '0xff01000a', '0xff03000b', '0xff04000b', null],
    ['Function C / F3', null,         '0xff03000c', '0xff04000c', null],
    ['Function D / F4', null,         '0xff03000d', '0xff04000d', null],
];
const SUBST_COL = { pm2: 1, pm4: 2, smp: 3, pedal: 4 };
const SUBST_NAME = { pm2: 'PowerMic II', pm4: 'PowerMic 4', smp: 'SpeechMike', pedal: 'foot pedal' };
const SUBST_PAGE = { pm2: '0xff01', pm4: '0xff03', smp: '0xff04', pedal: '0xff02' };

function offer_target_substitution(before, after) {
    const from = SUBST_FAMILY[before], to = SUBST_FAMILY[after];
    if (!from || !to || from == to) {
        return;
    }
    const lookup = {};
    for (const row of SUBST_TABLE) {
        if (row[SUBST_COL[from]]) {
            lookup[row[SUBST_COL[from]]] = { job: row[0], to: row[SUBST_COL[to]] };
        }
    }
    const affected = config['mappings'].filter((m) => (m['target_usage'] || '').toLowerCase().startsWith(SUBST_PAGE[from]));
    if (!affected.length) {
        return;
    }
    const moves = affected.filter((m) => lookup[m['target_usage'].toLowerCase()] && lookup[m['target_usage'].toLowerCase()].to);
    const stuck = affected.filter((m) => !moves.includes(m));
    // names from each type's own list (the page has already switched type)
    const name_in = (type, u) => ((usages[type] || {})[u] || {}).name || u;
    const lines = [...new Set(moves.map((m) => {
        const t = m['target_usage'].toLowerCase();
        return name_in(before, t) + ' → ' + name_in(after, lookup[t].to);
    }))];
    let msg = affected.length + ' mapping' + (affected.length == 1 ? '' : 's') + ' send ' + SUBST_NAME[from] + ' buttons, which the ' + SUBST_NAME[to] + ' type doesn\'t have.';
    if (moves.length) {
        msg += '\n\nSwitch them to the ' + SUBST_NAME[to] + '\'s buttons for the same job?\n' + lines.join('\n');
    }
    if (stuck.length) {
        msg += '\n\n' + stuck.length + ' have no equivalent and stay as they are (they won\'t do anything until you change them): ' +
            [...new Set(stuck.map((m) => name_in(before, m['target_usage'].toLowerCase())))].join(', ');
    }
    if (!moves.length) {
        alert(msg);
        return;
    }
    if (!confirm(msg)) {
        return;
    }
    for (const m of moves) {
        m['target_usage'] = lookup[m['target_usage'].toLowerCase()].to;
    }
    set_mappings_ui_state();
    md_refresh();
}

// ---------------------------------------------------------------------------
// Settings version 20 (TrueMap firmware): combos, tap dance, cycles, per-key
// hold time, auto-scroll, one-shot, IntelliComplete / Caps Word and macro
// names. They travel to the board as one blob of records (see the firmware's
// extras.h); on the page they live in config['extras'].

const EXTRAS_MAX = 1024;
const EXTRAS_BYTES_IN_PACKET = 24;
const X_COMBO = 1, X_TAPDANCE = 2, X_CYCLE = 3, X_KEY_TIMING = 4, X_AUTOSCROLL = 5, X_ONESHOT = 6, X_TEXT = 7, X_MACRO_NAME = 8;
const X_MAX = { combos: 16, tapdances: 16, cycles: 16, key_timings: 16, gears: 8, cycle_steps: 8, combo_keys: 4 };
const TD_ACTIONS = { 1: 'tap', 2: 'double tap', 3: 'triple tap', 4: 'hold', 5: 'tap then hold' };
const AS_DEFAULT_FIXED = [[300, 1], [140, 1], [60, 1]];
const AS_DEFAULT_GEARS = [[400, 1], [300, 1], [200, 1], [140, 1], [90, 1], [60, 1], [35, 2]];

function device_has_extras() {
    return device_version >= 20;
}

function default_extras() {
    return {
        combos: [],       // { keys: [usage...], port, window_ms, block }
        tapdances: [],    // { usage, port, term_ms }
        cycles: [],       // { usage, port, steps }
        key_timings: [],  // { usage, port, term_ms, hold_on_other }
        autoscroll: {
            stop_on_press: true, stop_on_wheel: true, stop_on_move: false,
            fixed: AS_DEFAULT_FIXED.map((x) => [...x]),
            gears: AS_DEFAULT_GEARS.map((x) => [...x]),
        },
        oneshot: { timeout_ms: 3000, tap_locks: true },
        text: { intellicomplete: false, caps_word_timeout: true },
        macro_names: {},  // macro index (0-based) -> name
    };
}

function extras() {
    if (!config['extras']) {
        config['extras'] = default_extras();
    }
    const d = default_extras();
    for (const k of Object.keys(d)) {
        if (config['extras'][k] === undefined) {
            config['extras'][k] = d[k];
        }
    }
    return config['extras'];
}

const xu = (v) => '0x' + (v >>> 0).toString(16).padStart(8, '0');
const x_combo_usage = (i) => xu(0xFFE10000 + i + 1);
const x_td_usage = (i, a) => xu(0xFFE20000 + (i << 4) + a);
const x_cycle_usage = (i, s) => xu(0xFFE30000 + (i << 4) + s);

function x_le16(v) { return [v & 0xFF, (v >> 8) & 0xFF]; }
function x_le32(v) { v = v >>> 0; return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }

function extras_encode(x) {
    const out = [];
    const rec = (type, payload) => {
        if (payload.length > 255) {
            payload = payload.slice(0, 255);
        }
        out.push(type, payload.length, ...payload);
    };
    for (const c of x.combos) {
        rec(X_COMBO, [c.block ? 1 : 0, ...x_le16(c.window_ms || 50), c.keys.length,
            ...c.keys.flatMap((u) => [...x_le32(parseInt(u, 16)), c.port || 0])]);
    }
    for (const t of x.tapdances) {
        rec(X_TAPDANCE, [...x_le32(parseInt(t.usage, 16)), t.port || 0, ...x_le16(t.term_ms || 200)]);
    }
    for (const c of x.cycles) {
        rec(X_CYCLE, [...x_le32(parseInt(c.usage, 16)), c.port || 0, c.steps]);
    }
    for (const k of x.key_timings) {
        rec(X_KEY_TIMING, [...x_le32(parseInt(k.usage, 16)), k.port || 0, ...x_le16(k.term_ms || 0), k.hold_on_other ? 1 : 0]);
    }
    const a = x.autoscroll;
    rec(X_AUTOSCROLL, [(a.stop_on_press ? 1 : 0) | (a.stop_on_wheel ? 2 : 0) | (a.stop_on_move ? 4 : 0),
        ...a.fixed.flatMap(([ms, n]) => [...x_le16(ms), n]),
        a.gears.length, ...a.gears.flatMap(([ms, n]) => [...x_le16(ms), n])]);
    rec(X_ONESHOT, [...x_le16(x.oneshot.timeout_ms), x.oneshot.tap_locks ? 1 : 0]);
    rec(X_TEXT, [(x.text.intellicomplete ? 1 : 0) | (x.text.caps_word_timeout ? 2 : 0)]);
    for (const [i, name] of Object.entries(x.macro_names)) {
        if (name) {
            rec(X_MACRO_NAME, [parseInt(i), ...new TextEncoder().encode(name.slice(0, 40))]);
        }
    }
    out.push(...extras_encode_v21(x21()));
    return out;
}

function extras_decode(bytes) {
    const x = default_extras();
    const u16 = (p) => bytes[p] | (bytes[p + 1] << 8);
    const u32 = (p) => (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) >>> 0;
    for (let pos = 0; pos + 2 <= bytes.length;) {
        const type = bytes[pos], len = bytes[pos + 1], p = pos + 2;
        pos += 2 + len;
        if (pos > bytes.length) {
            break;
        }
        switch (type) {
            case X_COMBO: {
                const n = bytes[p + 3];
                const keys = [];
                for (let i = 0; i < n; i++) {
                    keys.push(xu(u32(p + 4 + i * 5)));
                }
                x.combos.push({ keys, port: n ? bytes[p + 8] : 0, window_ms: u16(p + 1), block: !!(bytes[p] & 1) });
                break;
            }
            case X_TAPDANCE:
                x.tapdances.push({ usage: xu(u32(p)), port: bytes[p + 4], term_ms: u16(p + 5) });
                break;
            case X_CYCLE:
                x.cycles.push({ usage: xu(u32(p)), port: bytes[p + 4], steps: bytes[p + 5] });
                break;
            case X_KEY_TIMING:
                x.key_timings.push({ usage: xu(u32(p)), port: bytes[p + 4], term_ms: u16(p + 5), hold_on_other: !!(bytes[p + 7] & 1) });
                break;
            case X_AUTOSCROLL: {
                const f = bytes[p];
                x.autoscroll.stop_on_press = !!(f & 1);
                x.autoscroll.stop_on_wheel = !!(f & 2);
                x.autoscroll.stop_on_move = !!(f & 4);
                x.autoscroll.fixed = [0, 1, 2].map((i) => [u16(p + 1 + i * 3), bytes[p + 3 + i * 3]]);
                const n = bytes[p + 10];
                x.autoscroll.gears = [];
                for (let i = 0; i < n; i++) {
                    x.autoscroll.gears.push([u16(p + 11 + i * 3), bytes[p + 13 + i * 3]]);
                }
                break;
            }
            case X_ONESHOT:
                x.oneshot = { timeout_ms: u16(p), tap_locks: !!(bytes[p + 2] & 1) };
                break;
            case X_TEXT:
                x.text = { intellicomplete: !!(bytes[p] & 1), caps_word_timeout: !!(bytes[p] & 2) };
                break;
            case X_MACRO_NAME:
                x.macro_names[bytes[p]] = new TextDecoder().decode(Uint8Array.from(bytes.slice(p + 1, p + len)));
                break;
        }
    }
    extras_decode_v21(bytes, x);
    return x;
}

function extras_in_use(x = extras()) {
    const d = default_extras();
    return x.combos.length || x.tapdances.length || x.cycles.length || x.key_timings.length ||
        Object.values(x.macro_names).some((n) => n) ||
        JSON.stringify(x.autoscroll) != JSON.stringify(d.autoscroll) ||
        JSON.stringify(x.oneshot) != JSON.stringify(d.oneshot) ||
        JSON.stringify(x.text) != JSON.stringify(d.text) ||
        config['mappings'].some((m) => /^0xffe[4-7]/i.test(m['target_usage'] || '')) ||
        (x.wheel_keys || []).length || (x.devices || []).length || x.idle_seconds || Object.keys(x.macro_repeats || {}).length;
}

// Combos, tap dances and cycles that no mapping uses any more are dropped, and
// the rest renumbered (the board numbers them by position).
function extras_prune() {
    const x = extras();
    const used = (re) => new Set(config['mappings'].map((m) => (m['source_usage'] || '').toLowerCase()).filter((u) => re.test(u)));
    const renumber = (list, page, shift, keep_test) => {
        const in_use = used(new RegExp('^0x' + page));
        const keep = [];
        const map = {};
        list.forEach((item, i) => {
            const refs = [...in_use].filter((u) => keep_test(u, i));
            if (refs.length) {
                map[i] = keep.length;
                keep.push(item);
            }
        });
        if (keep.length == list.length) {
            return list;
        }
        for (const m of config['mappings']) {
            const u = (m['source_usage'] || '').toLowerCase();
            if (u.startsWith('0x' + page)) {
                const v = parseInt(u, 16) & 0xFFFF;
                const i = shift ? (v >> 4) : v - 1;
                if (i in map) {
                    m['source_usage'] = xu((parseInt('0x' + page + '0000', 16)) + (shift ? ((map[i] << 4) | (v & 0xF)) : map[i] + 1));
                }
            }
        }
        return keep;
    };
    x.combos = renumber(x.combos, 'ffe1', false, (u, i) => (parseInt(u, 16) & 0xFFFF) == i + 1);
    x.tapdances = renumber(x.tapdances, 'ffe2', true, (u, i) => ((parseInt(u, 16) & 0xFFFF) >> 4) == i);
    x.cycles = renumber(x.cycles, 'ffe3', true, (u, i) => ((parseInt(u, 16) & 0xFFFF) >> 4) == i);
    x.key_timings = x.key_timings.filter((k) => k.term_ms || k.hold_on_other);
}

// names for the inputs these make
function extras_source_name(usage) {
    if (typeof usage == 'string' && /^0xffe8/i.test(usage)) {
        return wheel_key_name(usage);
    }
    if (typeof usage != 'string' || !/^0xffe[123]/i.test(usage) || typeof config == 'undefined') {
        return null;
    }
    const x = extras();
    const v = parseInt(usage, 16) & 0xFFFF;
    const page = usage.slice(0, 6).toLowerCase();
    const at = (p) => p ? ' (port ' + p + ')' : '';
    if (page == '0xffe1') {
        const c = x.combos[v - 1];
        return c ? c.keys.map((k) => readable_usage_name(k)).join(' + ') + (c.block ? ' only' : '') + at(c.port) : 'Combo ' + v;
    }
    if (page == '0xffe2') {
        const t = x.tapdances[v >> 4];
        return (t ? readable_usage_name(t.usage) + at(t.port) : 'Tap dance ' + ((v >> 4) + 1)) + ': ' + (TD_ACTIONS[v & 0xF] || '?');
    }
    const c = x.cycles[v >> 4];
    return (c ? readable_usage_name(c.usage) + at(c.port) : 'Cycle ' + ((v >> 4) + 1)) + ': press ' + (v & 0xF);
}

function extras_storage_bytes() {
    return 2 + extras_encode(extras()).length;
}

async function send_extras_to_device() {
    if (!device_has_extras()) {
        if (extras_in_use()) {
            display_info('Combos (firmware), tap dance, cycles, auto-scroll and the other version 20 features are not saved: this board needs the latest TrueMap firmware for them.');
        }
        return;
    }
    extras_prune();
    const bytes = extras_encode(extras());
    if (bytes.length > EXTRAS_MAX) {
        throw new Error('Too many combos, tap dances and macro names (' + bytes.length + ' of ' + EXTRAS_MAX + ' bytes). Remove some first.');
    }
    await send_feature_command(CLEAR_EXTRAS);
    for (let i = 0; i < bytes.length; i += EXTRAS_BYTES_IN_PACKET) {
        const chunk = bytes.slice(i, i + EXTRAS_BYTES_IN_PACKET);
        await send_feature_command(APPEND_EXTRAS, [[UINT8, chunk.length], ...chunk.map((b) => [UINT8, b])]);
    }
}

async function load_extras_from_device() {
    if (!device_has_extras()) {
        config['extras'] = default_extras();
        return;
    }
    const bytes = [];
    let total = 0;
    do {
        await send_feature_command(GET_EXTRAS, [[UINT16, bytes.length]]);
        const fields = await read_config_feature([UINT16, UINT8, ...new Array(EXTRAS_BYTES_IN_PACKET).fill(UINT8)]);
        total = fields[0];
        const len = fields[1];
        if (len == 0) {
            break;
        }
        bytes.push(...fields.slice(2, 2 + len));
    } while (bytes.length < total);
    config['extras'] = extras_decode(bytes);
}

// ---- making them from the Mappings tab

function x_same_key(a, b) {
    return (a || '').toLowerCase() == (b || '').toLowerCase();
}

// a combo made on the board (settings v20): up to four keys, own window, can block
function extras_add_combo(keys, port, block) {
    const x = extras();
    keys = keys.map((k) => k.toLowerCase());
    const sorted = [...keys].sort().join(',');
    let i = x.combos.findIndex((c) => (c.port || 0) == port && !!c.block == !!block && [...c.keys].sort().join(',') == sorted);
    if (i < 0) {
        if (x.combos.length >= X_MAX.combos) {
            alert('A board can hold ' + X_MAX.combos + ' combos. Delete one first.');
            return null;
        }
        x.combos.push({ keys, port, window_ms: 50, block: !!block });
        i = x.combos.length - 1;
    }
    if (block && port) {
        // a key with no mapping would pass through on every port at once; give
        // it its own mapping on this port so the board can hold it back
        for (const k of keys) {
            const mapped = config['mappings'].some((m) => x_same_key(m['source_usage'], k));
            if (!mapped && can_be_output(k)) {
                config['mappings'].push(Object.assign(new_mapping_like(null), { 'source_usage': k, 'target_usage': k, 'source_port': port }));
            }
        }
    }
    const usage = x_combo_usage(i);
    let mapping = config['mappings'].find((m) => x_same_key(m['source_usage'], usage));
    if (!mapping) {
        mapping = Object.assign(new_mapping_like(null), { 'source_usage': usage });
        config['mappings'].push(mapping);
    }
    return mapping;
}

function new_mapping_like(m) {
    return {
        'source_usage': '0x00000000',
        'target_usage': '0x00000000',
        'layers': m ? [...(m['layers'] || [0])] : [0],
        'sticky': false,
        'tap': false,
        'hold': false,
        'scaling': DEFAULT_SCALING,
        'source_port': 0,
        'target_port': m ? (m['target_port'] || 0) : 0,
    };
}

function is_real_key(usage) {
    return typeof usage == 'string' && !/^0x(fff[1235]|ffe[0-9a-f]|fffb|0000)/i.test(usage) && usage != '0x00000000';
}

function key_mappings(usage, port) {
    return config['mappings'].filter((x) => x_same_key(x['source_usage'], usage) && (x['source_port'] || 0) == (port || 0));
}

// The selected key becomes a tap dance: what it sends now becomes the single tap.
function make_tapdance(m) {
    const x = extras();
    if (x.tapdances.length >= X_MAX.tapdances) {
        alert('A board can hold ' + X_MAX.tapdances + ' tap dances.');
        return;
    }
    const usage = m['source_usage'].toLowerCase(), port = m['source_port'] || 0;
    x.tapdances.push({ usage, port, term_ms: 200 });
    const i = x.tapdances.length - 1;
    for (const k of key_mappings(usage, port)) {
        k['source_usage'] = x_td_usage(i, 1);
        k['source_port'] = 0;
        k['tap'] = k['hold'] = false;
    }
    for (const a of [2, 4]) {
        config['mappings'].push(Object.assign(new_mapping_like(m), { 'source_usage': x_td_usage(i, a) }));
    }
    set_mappings_ui_state();
    md_select(m, true);
}

function make_cycle(m) {
    const x = extras();
    if (x.cycles.length >= X_MAX.cycles) {
        alert('A board can hold ' + X_MAX.cycles + ' cycles.');
        return;
    }
    const usage = m['source_usage'].toLowerCase(), port = m['source_port'] || 0;
    x.cycles.push({ usage, port, steps: 2 });
    const i = x.cycles.length - 1;
    for (const k of key_mappings(usage, port)) {
        k['source_usage'] = x_cycle_usage(i, 1);
        k['source_port'] = 0;
        k['tap'] = k['hold'] = false;
    }
    config['mappings'].push(Object.assign(new_mapping_like(m), { 'source_usage': x_cycle_usage(i, 2) }));
    set_mappings_ui_state();
    md_select(m, true);
}

// back to a plain key: the tap (or first step) mappings go back on the key, the rest are deleted
function undo_key_feature(m) {
    const x = extras();
    const u = m['source_usage'].toLowerCase();
    const v = parseInt(u, 16) & 0xFFFF;
    const i = v >> 4;
    const page = u.slice(0, 6);
    const def = page == '0xffe2' ? x.tapdances[i] : x.cycles[i];
    if (!def) {
        return;
    }
    const first = page == '0xffe2' ? x_td_usage(i, 1) : x_cycle_usage(i, 1);
    let keep = null;
    config['mappings'] = config['mappings'].filter((k) => {
        const s = (k['source_usage'] || '').toLowerCase();
        if (!s.startsWith(page) || ((parseInt(s, 16) & 0xFFFF) >> 4) != i) {
            return true;
        }
        if (s == first) {
            k['source_usage'] = def.usage;
            k['source_port'] = def.port || 0;
            keep = keep || k;
            return true;
        }
        return false;
    });
    extras_prune();
    set_mappings_ui_state();
    selected_mapping = keep;
    md_refresh();
}

function key_timing_of(usage, port) {
    return extras().key_timings.find((k) => x_same_key(k.usage, usage) && (k.port || 0) == (port || 0));
}

// the "Key features" part of the inspector
function render_key_features(m, body) {
    const set = md_element('fieldset');
    set.appendChild(md_element('legend', {}, 'Key features'));
    if (!device_has_extras()) {
        set.appendChild(md_element('p', { class: 'md-insp-note mb-0' }, 'Tap dance, cycles and per-key hold time need the latest TrueMap firmware on the board.'));
        body.appendChild(set);
        return;
    }
    const x = extras();
    const u = (m['source_usage'] || '').toLowerCase();
    const num = (value, min, max, onchange) => {
        const input = md_element('input', { type: 'number', class: 'form-control form-control-sm md-kf-num', min: String(min), max: String(max) });
        input.value = String(value);
        input.addEventListener('change', () => onchange(Math.max(min, Math.min(max, parseInt(input.value) || min))));
        return input;
    };
    if (u.startsWith('0xffe2')) {
        const i = (parseInt(u, 16) & 0xFFFF) >> 4;
        const t = x.tapdances[i];
        if (t) {
            const row = md_element('div', { class: 'md-kf-row' });
            row.appendChild(md_element('span', {}, 'Tap dance on ' + readable_usage_name(t.usage) + '. Taps count if they come within'));
            row.appendChild(num(t.term_ms, 100, 1000, (v) => { t.term_ms = v; }));
            row.appendChild(md_element('span', {}, 'ms.'));
            set.appendChild(row);
            const adds = md_element('div', { class: 'md-presets' });
            for (const a of [1, 2, 3, 4, 5]) {
                if (config['mappings'].some((k) => x_same_key(k['source_usage'], x_td_usage(i, a)))) {
                    continue;
                }
                const b = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, '+ ' + TD_ACTIONS[a]);
                b.addEventListener('click', () => {
                    const k = Object.assign(new_mapping_like(m), { 'source_usage': x_td_usage(i, a) });
                    config['mappings'].push(k);
                    set_mappings_ui_state();
                    md_select(k, true);
                });
                adds.appendChild(b);
            }
            const undo = md_element('button', { type: 'button', class: 'btn btn-sm btn-link md-insp-link' }, 'Back to a plain key');
            undo.addEventListener('click', () => undo_key_feature(m));
            adds.appendChild(undo);
            set.appendChild(adds);
        }
    } else if (u.startsWith('0xffe3')) {
        const i = (parseInt(u, 16) & 0xFFFF) >> 4;
        const c = x.cycles[i];
        if (c) {
            set.appendChild(md_element('p', { class: 'md-insp-note' }, 'Cycle on ' + readable_usage_name(c.usage) + ': each press sends the next one of ' + c.steps + ', then starts over.'));
            const adds = md_element('div', { class: 'md-presets' });
            if (c.steps < X_MAX.cycle_steps) {
                const b = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, '+ Step ' + (c.steps + 1));
                b.addEventListener('click', () => {
                    c.steps++;
                    const k = Object.assign(new_mapping_like(m), { 'source_usage': x_cycle_usage(i, c.steps) });
                    config['mappings'].push(k);
                    set_mappings_ui_state();
                    md_select(k, true);
                });
                adds.appendChild(b);
            }
            const undo = md_element('button', { type: 'button', class: 'btn btn-sm btn-link md-insp-link' }, 'Back to a plain key');
            undo.addEventListener('click', () => undo_key_feature(m));
            adds.appendChild(undo);
            set.appendChild(adds);
        }
    } else if (u.startsWith('0xffe1')) {
        const c = x.combos[(parseInt(u, 16) & 0xFFFF) - 1];
        if (c) {
            const row = md_element('div', { class: 'md-kf-row' });
            row.appendChild(md_element('span', {}, 'Keys count as together within'));
            row.appendChild(num(c.window_ms, 10, 500, (v) => { c.window_ms = v; }));
            row.appendChild(md_element('span', {}, 'ms.'));
            set.appendChild(row);
            const id = 'insp_combo_block';
            const wrap = md_element('div', { class: 'form-check' });
            const box = md_element('input', { type: 'checkbox', class: 'form-check-input', id });
            box.checked = !!c.block;
            box.addEventListener('change', () => { c.block = box.checked; md_mapping_changed(); });
            wrap.appendChild(box);
            wrap.appendChild(md_element('label', { class: 'form-check-label', for: id }, 'Block each key\'s own action when they\'re pressed together'));
            set.appendChild(wrap);
        }
    } else if (/^0xffe8/i.test(u || '') && (x21().wheel_keys || [])[(parseInt(u, 16) & 0xFFFF) >> 4]) {
        insp_wheel_key_options(set, m, u);
    } else if (is_real_key(u) && [0x00010038, 0x000c0238, 0x00010037, 0x00010036].includes(parseInt(u, 16))) {
        // a wheel, tilt, jog or dial: offer it as keys
        const port = m['source_port'] || 0;
        set.appendChild(md_element('p', { class: 'md-insp-note' }, 'Use this ' + readable_usage_name(u).toLowerCase() + ' as two keys (one per direction), each mapped to anything — instead of scrolling.'));
        const row = md_element('div', { class: 'md-kf-row' });
        const kind = md_element('select', { class: 'form-select form-select-sm w-auto', 'aria-label': 'Kind of wheel' });
        for (const [k, n] of Object.entries(WHEEL_KINDS)) {
            kind.appendChild(md_element('option', { value: k }, n));
        }
        kind.value = parseInt(u, 16) == 0x00010037 ? '1' : '0';
        const go = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, 'Use as keys');
        go.addEventListener('click', () => {
            if (!device_v21() && device != null) {
                alert('This needs the latest TrueMap firmware on the board.');
                return;
            }
            const k = parseInt(kind.value);
            const a = wheel_keys_mapping(u, port, k, 1);
            wheel_keys_mapping(u, port, k, 2);
            config['mappings'] = config['mappings'].filter((x) => x !== m || x['target_usage'] != '0x00000000');
            set_mappings_ui_state();
            md_select(a, true);
        });
        row.appendChild(kind);
        row.appendChild(go);
        set.appendChild(row);
    } else if (is_real_key(u)) {
        const port = m['source_port'] || 0;
        const btns = md_element('div', { class: 'md-presets' });
        const td = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', title: 'Different actions for tap, double tap and hold' }, 'Tap dance');
        td.addEventListener('click', () => make_tapdance(m));
        const cy = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary', title: 'Each press sends the next action in a list' }, 'Cycle');
        cy.addEventListener('click', () => make_cycle(m));
        btns.appendChild(td);
        btns.appendChild(cy);
        set.appendChild(btns);
        const kt = key_timing_of(u, port);
        const row = md_element('div', { class: 'md-kf-row' });
        row.appendChild(md_element('span', {}, 'Hold time for this key'));
        const input = md_element('input', { type: 'number', class: 'form-control form-control-sm md-kf-num', min: '0', max: '5000', placeholder: String(Math.round(config['tap_hold_threshold'] / 1000)) });
        input.value = kt && kt.term_ms ? String(kt.term_ms) : '';
        const other_id = 'insp_hold_other';
        const other = md_element('input', { type: 'checkbox', class: 'form-check-input', id: other_id });
        other.checked = !!(kt && kt.hold_on_other);
        const update = () => {
            let k = key_timing_of(u, port);
            if (!k) {
                if (x.key_timings.length >= X_MAX.key_timings) {
                    alert('A board can hold ' + X_MAX.key_timings + ' per-key hold times.');
                    return;
                }
                k = { usage: u, port, term_ms: 0, hold_on_other: false };
                x.key_timings.push(k);
            }
            k.term_ms = Math.max(0, Math.min(5000, parseInt(input.value) || 0));
            k.hold_on_other = other.checked;
            extras_prune();
        };
        input.addEventListener('change', update);
        other.addEventListener('change', update);
        row.appendChild(input);
        row.appendChild(md_element('span', {}, 'ms'));
        set.appendChild(row);
        const wrap = md_element('div', { class: 'form-check' });
        wrap.appendChild(other);
        wrap.appendChild(md_element('label', { class: 'form-check-label', for: other_id }, 'Count it as held as soon as another key is pressed'));
        set.appendChild(wrap);
        set.appendChild(md_element('p', { class: 'md-insp-note mb-0' }, 'Hold time matters for "Only on tap" / "Only on hold" mappings of this key.'));
    } else {
        return;
    }
    body.appendChild(set);
}

// ---- Settings tab: auto-scroll, one-shot, typing, and what's on the board

function render_key_features_card() {
    const box = document.getElementById('kf_body');
    if (!box) {
        return;
    }
    clear_children(box);
    const x = extras();
    document.getElementById('kf_note').classList.toggle('d-none', device == null || device_has_extras());
    const sec = (title) => {
        const s = md_element('div', { class: 'md-board-sec' });
        s.appendChild(md_element('h3', { class: 'md-board-lbl' }, title));
        box.appendChild(s);
        return s;
    };
    const check = (parent, id, label, value, onchange) => {
        const wrap = md_element('div', { class: 'form-check' });
        const b = md_element('input', { type: 'checkbox', class: 'form-check-input', id });
        b.checked = !!value;
        b.addEventListener('change', () => onchange(b.checked));
        wrap.appendChild(b);
        wrap.appendChild(md_element('label', { class: 'form-check-label', for: id }, label));
        parent.appendChild(wrap);
    };
    const num = (value, min, max, onchange, label) => {
        const input = md_element('input', { type: 'number', class: 'form-control form-control-sm md-kf-num', min: String(min), max: String(max), 'aria-label': label });
        input.value = String(value);
        input.addEventListener('change', () => {
            const v = Math.max(min, Math.min(max, parseInt(input.value) || min));
            input.value = String(v);
            onchange(v);
        });
        return input;
    };

    // auto-scroll
    const as = sec('Auto-scroll');
    as.appendChild(md_element('p', { class: 'md-board-p' }, 'Put "Auto-scroll" outputs on buttons (in the output list under TrueMap). They all use these three speeds: the fixed ones scroll at one speed, "fast/slow" swaps between fast and slow, and "3 speeds" steps through all three. With fast/slow and 3 speeds the other direction turns round at the same speed.'));
    const fixed = md_element('div', { class: 'md-kf-grid' });
    ['Slow', 'Medium', 'Fast'].forEach((name, i) => {
        const row = md_element('div', { class: 'md-kf-row' });
        row.appendChild(md_element('span', { class: 'md-kf-name' }, name));
        row.appendChild(md_element('span', {}, 'every'));
        row.appendChild(num(x.autoscroll.fixed[i][0], 10, 2000, (v) => { x.autoscroll.fixed[i][0] = v; }, name + ' interval'));
        row.appendChild(md_element('span', {}, 'ms,'));
        row.appendChild(num(x.autoscroll.fixed[i][1], 1, 10, (v) => { x.autoscroll.fixed[i][1] = v; }, name + ' lines'));
        row.appendChild(md_element('span', {}, 'line(s)'));
        fixed.appendChild(row);
    });
    as.appendChild(fixed);
    const uses_gears = config['mappings'].some((m) => /^0xffe4000[78]$/i.test(m['target_usage'] || ''));
    const gears_h = md_element('h4', { class: 'md-kf-sub' + (uses_gears ? '' : ' d-none') }, 'Faster each press (older outputs)');
    as.appendChild(gears_h);
    const gears = md_element('div', { class: 'md-kf-grid' + (uses_gears ? '' : ' d-none') });
    x.autoscroll.gears.forEach((g, i) => {
        const row = md_element('div', { class: 'md-kf-row' });
        row.appendChild(md_element('span', { class: 'md-kf-name' }, 'Gear ' + (i + 1)));
        row.appendChild(md_element('span', {}, 'every'));
        row.appendChild(num(g[0], 10, 2000, (v) => { g[0] = v; }, 'Gear ' + (i + 1) + ' interval'));
        row.appendChild(md_element('span', {}, 'ms,'));
        row.appendChild(num(g[1], 1, 10, (v) => { g[1] = v; }, 'Gear ' + (i + 1) + ' lines'));
        row.appendChild(md_element('span', {}, 'line(s)'));
        if (x.autoscroll.gears.length > 1) {
            const del = md_element('button', { type: 'button', class: 'btn btn-sm btn-link text-danger', 'aria-label': 'Remove gear ' + (i + 1) }, '✕');
            del.addEventListener('click', () => { x.autoscroll.gears.splice(i, 1); render_key_features_card(); });
            row.appendChild(del);
        }
        gears.appendChild(row);
    });
    as.appendChild(gears);
    const gb = md_element('div', { class: 'md-board-btns' });
    if (uses_gears && x.autoscroll.gears.length < X_MAX.gears) {
        const add = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, '+ Gear');
        add.addEventListener('click', () => {
            const last = x.autoscroll.gears[x.autoscroll.gears.length - 1] || [100, 1];
            x.autoscroll.gears.push([Math.max(10, Math.round(last[0] * 0.7)), last[1]]);
            render_key_features_card();
        });
        gb.appendChild(add);
    }
    const reset = md_element('button', { type: 'button', class: 'btn btn-sm btn-link' }, 'Default speeds');
    reset.addEventListener('click', () => {
        x.autoscroll.fixed = AS_DEFAULT_FIXED.map((v) => [...v]);
        x.autoscroll.gears = AS_DEFAULT_GEARS.map((v) => [...v]);
        render_key_features_card();
    });
    gb.appendChild(reset);
    as.appendChild(gb);
    check(as, 'kf_as_press', 'Any key or button press stops it', x.autoscroll.stop_on_press, (v) => { x.autoscroll.stop_on_press = v; });
    check(as, 'kf_as_wheel', 'Turning a scroll wheel stops it', x.autoscroll.stop_on_wheel, (v) => { x.autoscroll.stop_on_wheel = v; });
    check(as, 'kf_as_move', 'Moving the mouse stops it', x.autoscroll.stop_on_move, (v) => { x.autoscroll.stop_on_move = v; });

    // one-shot
    const os = sec('One-shot keys');
    os.appendChild(md_element('p', { class: 'md-board-p' }, 'A one-shot Shift (or Ctrl, Alt, layer) applies to the next key only, so you don\'t have to hold it.'));
    const osr = md_element('div', { class: 'md-kf-row' });
    osr.appendChild(md_element('span', {}, 'Wait for the next key up to'));
    osr.appendChild(num(x.oneshot.timeout_ms, 0, 60000, (v) => { x.oneshot.timeout_ms = v; }, 'One-shot timeout'));
    osr.appendChild(md_element('span', {}, 'ms (0 = no limit)'));
    os.appendChild(osr);
    check(os, 'kf_os_lock', 'Pressing it twice locks it on (a third press unlocks)', x.oneshot.tap_locks, (v) => { x.oneshot.tap_locks = v; });

    // typing
    const ty = sec('Typing');
    check(ty, 'kf_ic', 'IntelliComplete on at start-up: capitalise the first letter after ". ", "? " or "! "', x.text.intellicomplete, (v) => { x.text.intellicomplete = v; });
    check(ty, 'kf_cw', 'Caps Word ends after 5 seconds without typing', x.text.caps_word_timeout, (v) => { x.text.caps_word_timeout = v; });
    ty.appendChild(md_element('p', { class: 'md-board-p mb-0' }, 'Caps Word types letters in capitals until a space or punctuation (- becomes _). "IntelliComplete on/off" and "Caps Word" are outputs you can put on a button.'));

    // what's set up
    extras_prune();
    render_key_features_v21(box, sec, check, num);

    const on = sec('On this profile');
    const list = md_element('ul', { class: 'md-kf-list' });
    const item = (text, onremove) => {
        const li = md_element('li', {}, text);
        if (onremove) {
            const del = md_element('button', { type: 'button', class: 'btn btn-sm btn-link text-danger' }, 'Remove');
            del.addEventListener('click', onremove);
            li.appendChild(del);
        }
        list.appendChild(li);
    };
    const drop_mappings = (re) => {
        config['mappings'] = config['mappings'].filter((m) => !re.test(m['source_usage'] || ''));
        extras_prune();
        set_mappings_ui_state();
        md_refresh();
        render_key_features_card();
    };
    x.combos.forEach((c, i) => item('Combo: ' + extras_source_name(x_combo_usage(i)) + ' (' + c.window_ms + ' ms)', () => drop_mappings(new RegExp('^' + x_combo_usage(i) + '$', 'i'))));
    x.tapdances.forEach((t, i) => item('Tap dance: ' + readable_usage_name(t.usage) + (t.port ? ' (port ' + t.port + ')' : '') + ', ' + t.term_ms + ' ms', () => {
        const m = config['mappings'].find((k) => x_same_key(k['source_usage'], x_td_usage(i, 1))) || config['mappings'].find((k) => ((parseInt(k['source_usage'], 16) >>> 0) & 0xFFFFFFF0) == ((0xFFE20000 + (i << 4)) >>> 0));
        if (m) { undo_key_feature(m); render_key_features_card(); }
    }));
    x.cycles.forEach((c, i) => item('Cycle: ' + readable_usage_name(c.usage) + ', ' + c.steps + ' steps', () => {
        const m = config['mappings'].find((k) => ((parseInt(k['source_usage'], 16) >>> 0) & 0xFFFFFFF0) == ((0xFFE30000 + (i << 4)) >>> 0));
        if (m) { undo_key_feature(m); render_key_features_card(); }
    }));
    (x.wheel_keys || []).forEach((w, i) => item('As keys: ' + readable_usage_name(w.usage) + (w.port ? ' (port ' + w.port + ')' : '') + ', ' + WHEEL_KINDS[w.kind], () => drop_mappings(new RegExp('^0xffe8' + i.toString(16).padStart(3, '0') + '[0-9a-f]$', 'i'))));
    x.key_timings.forEach((k, i) => item('Hold time: ' + readable_usage_name(k.usage) + ' ' + (k.term_ms ? k.term_ms + ' ms' : 'default') + (k.hold_on_other ? ', held when another key is pressed' : ''), () => {
        x.key_timings.splice(i, 1);
        render_key_features_card();
    }));
    if (!list.children.length) {
        on.appendChild(md_element('p', { class: 'md-board-p mb-0' }, 'No combos, tap dances, cycles or per-key hold times yet. Make them from a key\'s panel on the Mappings tab.'));
    } else {
        on.appendChild(list);
    }
    on.appendChild(md_element('p', { class: 'md-board-p mb-0' }, 'Uses ' + extras_storage_bytes() + ' of ' + (EXTRAS_MAX + 2) + ' bytes for these.'));
}

function key_features_setup() {
    document.getElementById('nav-settings-tab').addEventListener('shown.bs.tab', render_key_features_card);
    render_key_features_card();
}

// ---------------------------------------------------------------------------
// Settings version 21 (TrueMap firmware): board name, firmware version,
// restart, test without sending, board state, auto profile by device,
// backup/restore of all profiles, scroll lock, pointer and scroll modes,
// per-port pointer speed / debounce, idle return, macro wait / repeat,
// wheels and knobs as keys.

const BOARD_GET_NAME = 109, BOARD_SET_NAME = 110, BOARD_GET_RULE = 111, BOARD_SET_RULE = 112;
const FIRMWARE_INFO = 113, RESTART_BOARD = 114, DRY_RUN = 115, GET_STATE = 116;
const PROFILE_RAW_READ = 117, PROFILE_RAW_BEGIN = 118, PROFILE_RAW_APPEND = 119, PROFILE_RAW_COMMIT = 120, GET_DEVICE = 121;
const X_SCROLL_LOCK = 9, X_DEVICE = 10, X_POINTER_MODES = 11, X_IDLE = 12, X_MACRO_REPEAT = 13, X_WHEEL_KEYS = 14;
const BOARD_NAME_LEN = 24, NBOARD_RULES = 8;
const WHEEL_KINDS = { 0: 'turns (wheel, tilt)', 1: 'jog (wraps 0-255)', 2: 'dial that holds its position' };
const KNOWN_DEVICES = [
    ['0b33:0020', 'Contour ShuttleXpress'], ['0b33:0030', 'Contour ShuttlePRO v2'], ['046d:c08b', 'Logitech G502'],
    ['046d:c07e', 'Logitech G402'], ['05f3:00ff', 'Foot pedal (3Key)'],
];

let board_info = { name: '', version: '', rules: [], devices: [] };
let board_state = null;
let state_timer = null;
let dry_run_timer = null;

function device_v21() {
    return device_version >= 21;
}

function default_v21() {
    return {
        scroll_lock: { horizontal: false, invert: false, start_speed: 2, per_line: [60, 35, 20, 12, 6] },
        devices: [],          // { port, speed_pct, accel, debounce_ms }
        pointer_modes: { precision_pct: 30, fast_scroll_x: 5 },
        idle_seconds: 0,
        macro_repeats: {},    // macro index -> { delay_ms, rate_ms }
        wheel_keys: [],       // { usage, port, kind, step }
    };
}

function x21() {
    const x = extras();
    const d = default_v21();
    for (const k of Object.keys(d)) {
        if (x[k] === undefined) {
            x[k] = d[k];
        }
    }
    return x;
}

const x_wheel_usage = (i, a) => xu(0xFFE80000 + (i << 4) + a);

// extra records for v21, after the v20 ones (older boards skip them)
function extras_encode_v21(x) {
    const out = [];
    const rec = (type, payload) => out.push(type, payload.length, ...payload);
    const sl = x.scroll_lock;
    rec(X_SCROLL_LOCK, [(sl.horizontal ? 1 : 0) | (sl.invert ? 2 : 0), sl.start_speed, ...sl.per_line.flatMap((v) => x_le16(v))]);
    for (const d of x.devices) {
        rec(X_DEVICE, [d.port, ...x_le16(d.speed_pct), d.accel, d.debounce_ms]);
    }
    rec(X_POINTER_MODES, [x.pointer_modes.precision_pct, x.pointer_modes.fast_scroll_x]);
    if (x.idle_seconds) {
        rec(X_IDLE, x_le16(x.idle_seconds));
    }
    for (const [m, r] of Object.entries(x.macro_repeats)) {
        rec(X_MACRO_REPEAT, [parseInt(m), ...x_le16(r.delay_ms), ...x_le16(r.rate_ms)]);
    }
    for (const w of x.wheel_keys) {
        rec(X_WHEEL_KEYS, [...x_le32(parseInt(w.usage, 16)), w.port || 0, w.kind, w.step || 0]);
    }
    return out;
}

function extras_decode_v21(bytes, x) {
    Object.assign(x, default_v21());
    x.scroll_lock = default_v21().scroll_lock;
    const u16 = (p) => bytes[p] | (bytes[p + 1] << 8);
    const u32 = (p) => (bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16) | (bytes[p + 3] << 24)) >>> 0;
    for (let pos = 0; pos + 2 <= bytes.length;) {
        const type = bytes[pos], len = bytes[pos + 1], p = pos + 2;
        pos += 2 + len;
        if (pos > bytes.length) {
            break;
        }
        switch (type) {
            case X_SCROLL_LOCK:
                x.scroll_lock = { horizontal: !!(bytes[p] & 1), invert: !!(bytes[p] & 2), start_speed: bytes[p + 1], per_line: [0, 1, 2, 3, 4].map((i) => u16(p + 2 + i * 2)) };
                break;
            case X_DEVICE:
                x.devices.push({ port: bytes[p], speed_pct: u16(p + 1), accel: bytes[p + 3], debounce_ms: bytes[p + 4] });
                break;
            case X_POINTER_MODES:
                x.pointer_modes = { precision_pct: bytes[p], fast_scroll_x: bytes[p + 1] };
                break;
            case X_IDLE:
                x.idle_seconds = u16(p);
                break;
            case X_MACRO_REPEAT:
                x.macro_repeats[bytes[p]] = { delay_ms: u16(p + 1), rate_ms: u16(p + 3) };
                break;
            case X_WHEEL_KEYS:
                x.wheel_keys.push({ usage: xu(u32(p)), port: bytes[p + 4], kind: bytes[p + 5], step: bytes[p + 6] });
                break;
        }
    }
    return x;
}

function wheel_key_name(usage) {
    if (typeof usage != 'string' || !/^0xffe8/i.test(usage) || typeof config == 'undefined') {
        return null;
    }
    const v = parseInt(usage, 16) & 0xFFFF;
    const w = (x21().wheel_keys || [])[v >> 4];
    const a = v & 0xF;
    const plain = { '0x00010037': 'Jog', '0x00010038': 'Wheel / ring', '0x000c0238': 'Tilt', '0x00010036': 'Slider' };
    const nm = w ? readable_usage_name(w.usage) : '';
    const kindName = w && w.kind == 2 ? 'Ring' : w && w.kind == 1 ? 'Jog' : null;
    const base = w ? (kindName || ((/^0x[0-9a-f]{8}$/i.test(nm) && plain[w.usage.toLowerCase()]) ? plain[w.usage.toLowerCase()] : nm)) + (w.port ? ' (port ' + w.port + ')' : '') : 'Wheel ' + ((v >> 4) + 1);
    const names = w && w.kind == 2 ? { 1: 'turned right (any amount)', 2: 'turned left (any amount)', 3: 'turned far right', 4: 'turned far left', 5: 'turned a little right', 6: 'turned a little left' }
        : w && w.kind == 1 ? { 1: 'jog clockwise', 2: 'jog counter-clockwise' }
        : { 1: 'turned up / right', 2: 'turned down / left' };
    return base + ': ' + (names[a] || '?');
}

function wheel_keys_prune() {
    const x = x21();
    const used = new Set(config['mappings'].map((m) => (m['source_usage'] || '').toLowerCase()).filter((u) => u.startsWith('0xffe8')).map((u) => (parseInt(u, 16) & 0xFFFF) >> 4));
    if (used.size == x.wheel_keys.length && [...used].every((i) => i < x.wheel_keys.length)) {
        return;
    }
    const map = {};
    const keep = [];
    x.wheel_keys.forEach((w, i) => {
        if (used.has(i)) {
            map[i] = keep.length;
            keep.push(w);
        }
    });
    for (const m of config['mappings']) {
        const u = (m['source_usage'] || '').toLowerCase();
        if (u.startsWith('0xffe8')) {
            const v = parseInt(u, 16) & 0xFFFF;
            if ((v >> 4) in map) {
                m['source_usage'] = x_wheel_usage(map[v >> 4], v & 0xF);
            }
        }
    }
    x.wheel_keys = keep;
}

// "use this wheel / jog / dial as keys": finds or makes the wheel-keys entry and
// a mapping for one direction
function wheel_keys_mapping(usage, port, kind, a) {
    const x = x21();
    usage = usage.toLowerCase();
    let i = x.wheel_keys.findIndex((w) => w.usage == usage && (w.port || 0) == port);
    if (i < 0) {
        if (x.wheel_keys.length >= 16) {
            alert('A board can use 16 wheels and knobs as keys.');
            return null;
        }
        x.wheel_keys.push({ usage, port, kind, step: kind == 2 ? 4 : 1 });
        i = x.wheel_keys.length - 1;
    }
    const src = x_wheel_usage(i, a);
    let m = config['mappings'].find((k) => x_same_key(k['source_usage'], src));
    if (!m) {
        m = Object.assign(new_mapping_like(null), { 'source_usage': src });
        config['mappings'].push(m);
    }
    return m;
}

// ---- board info, rules, state

async function board_cmd(command, fields = []) {
    await send_feature_command(command, fields);
}

async function load_board_info() {
    board_info = { name: '', version: '', rules: [], devices: [] };
    if (device == null || !device_v21()) {
        return;
    }
    await board_cmd(FIRMWARE_INFO);
    const fv = await read_config_feature(new Array(24).fill(UINT8));
    board_info.version = String.fromCharCode(...fv.filter((c) => c)).trim();
    await board_cmd(BOARD_GET_NAME);
    const nb = await read_config_feature(new Array(BOARD_NAME_LEN).fill(UINT8));
    board_info.name = String.fromCharCode(...nb.filter((c) => c));
    for (let i = 0; i < NBOARD_RULES; i++) {
        await board_cmd(BOARD_GET_RULE, [[UINT8, i]]);
        const [index, vid, pid, port, slot] = await read_config_feature([UINT8, UINT16, UINT16, UINT8, UINT8]);
        board_info.rules.push({ index: i, vid, pid, port, slot });
    }
    await load_plugged_devices();
    try {
        board_info.recovered = (await read_board_state()).recovered;
    } catch (e) {
        board_info.recovered = null;
    }
}

async function board_op(command, fields) {
    await send_feature_command(command, fields);
    const [result] = await read_config_feature([UINT8, UINT8, UINT8]);
    if (result != 1) {
        throw new Error('The board refused that (' + result + ').');
    }
}

async function save_board_name(name) {
    const bytes = Array.from(name.slice(0, BOARD_NAME_LEN), (c) => { const k = c.charCodeAt(0); return (k >= 0x20 && k < 0x7f) ? k : 0x3f; });
    while (bytes.length < BOARD_NAME_LEN) {
        bytes.push(0);
    }
    await board_op(BOARD_SET_NAME, bytes.map((b) => [UINT8, b]));
    board_info.name = name;
}

async function save_board_rule(rule) {
    await board_op(BOARD_SET_RULE, [[UINT8, rule.index], [UINT16, rule.vid], [UINT16, rule.pid], [UINT8, rule.port], [UINT8, rule.slot]]);
    board_info.rules[rule.index] = rule;
}

async function read_board_state() {
    await board_cmd(GET_STATE);
    const [layers, profile, flags, as_mode, as_dir, as_level, sl_speed, os_mods, os_layer, layer_to, rec_kind, rec_stage, rec_pc, rec_lr] =
        await read_config_feature([UINT8, UINT8, UINT16, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT8, UINT32, UINT32]);
    return { layers, profile, flags, as_mode, as_dir: (as_dir << 24) >> 24, as_level, sl_speed, os_mods, os_layer, layer_to,
        recovered: rec_kind ? { kind: rec_kind, stage: rec_stage, pc: rec_pc >>> 0, lr: rec_lr >>> 0 } : null };
}

async function set_dry_run(on) {
    await board_cmd(DRY_RUN, [[UINT8, on ? 1 : 0]]);
}

// ---- backup / restore of every profile

async function backup_all_profiles() {
    const out = { truemap_backup: 1, saved: new Date().toISOString(), board_name: board_info.name, profiles: [] };
    for (const p of profiles.filter((p) => p.saved)) {
        const bytes = [];
        for (let off = 0; off < 4096; off += 24) {
            await board_cmd(PROFILE_RAW_READ, [[UINT8, p.slot], [UINT16, off]]);
            const f = await read_config_feature([UINT8, ...new Array(24).fill(UINT8)]);
            bytes.push(...f.slice(1, 1 + f[0]));
        }
        let bin = '';
        for (const b of bytes) {
            bin += String.fromCharCode(b);
        }
        out.profiles.push({ slot: p.slot, name: p.name, data: btoa(bin) });
    }
    const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'truemap-backup-' + (board_info.name || 'board').replace(/[^A-Za-z0-9-]+/g, '-') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

async function restore_profiles(file) {
    const data = JSON.parse(await file.text());
    if (!data.truemap_backup || !Array.isArray(data.profiles)) {
        throw new Error('That file is not a TrueMap backup.');
    }
    const active = profiles.find((p) => p.active);
    const list = data.profiles.filter((p) => !active || p.slot != active.slot);
    const skipped = data.profiles.length - list.length;
    if (!confirm('Write ' + list.length + ' profile(s) from the backup to the board, replacing what is in those slots?' + (skipped ? ' The profile in use (' + (active.slot + 1) + ') is skipped: switch to another profile first to restore it.' : ''))) {
        return;
    }
    for (const p of list) {
        const bin = atob(p.data);
        await board_cmd(PROFILE_RAW_BEGIN);
        for (let off = 0; off < bin.length; off += 24) {
            const chunk = Array.from(bin.slice(off, off + 24), (c) => c.charCodeAt(0));
            await board_cmd(PROFILE_RAW_APPEND, [[UINT8, chunk.length], ...chunk.map((b) => [UINT8, b])]);
        }
        await profile_command(PROFILE_RAW_COMMIT, p.slot, p.name || '');
    }
    await refresh_profiles();
    display_info('Restored ' + list.length + ' profile(s).');
}

// ---- Live test: board state lights and "test without sending"

const STATE_FLAGS = [
    [0x0001, 'Caps Word'], [0x0002, 'Scroll lock'], [0x0004, 'Auto-scroll'], [0x0008, 'Click-lock'],
    [0x0010, 'Precision pointer'], [0x0020, 'Fast scroll'], [0x0100, 'IntelliComplete'],
];

function render_board_state() {
    const box = document.getElementById('live_state');
    if (!box) {
        return;
    }
    clear_children(box);
    const st = board_state;
    if (!st) {
        return;
    }
    const chip = (text, cls = '') => box.appendChild(md_element('span', { class: 'md-state-chip' + (cls ? ' ' + cls : '') }, text));
    if (st.flags & 0x0080) {
        chip('Safe start: mappings off until restart', 'warn');
    }
    if (st.flags & 0x0040) {
        chip('Testing without sending', 'warn');
    }
    const layers = [];
    for (let i = 0; i < 8; i++) {
        if (st.layers & (1 << i)) {
            layers.push(i);
        }
    }
    chip('Layer ' + layers.join(' + '), layers.some((l) => l != 0) ? 'on' : '');
    const prof = profiles.find((p) => p.slot == st.profile);
    chip('Profile ' + (prof && prof.name ? prof.name : st.profile + 1));
    for (const [bit, name] of STATE_FLAGS) {
        let text = name;
        if (bit == 0x0002 && (st.flags & bit)) {
            text += ' · speed ' + st.sl_speed;
        }
        if (bit == 0x0004 && (st.flags & bit)) {
            text += ' ' + (st.as_dir > 0 ? '↑' : '↓') + (st.as_mode == 2 ? ' · gear ' + (st.as_level + 1) : '');
        }
        chip(text, (st.flags & bit) ? 'on' : '');
    }
    if (st.os_mods) {
        const mods = ['Ctrl', 'Shift', 'Alt', 'Win', 'Right Ctrl', 'Right Shift', 'Right Alt', 'Right Win'].filter((_, i) => st.os_mods & (1 << i));
        chip('One-shot ' + mods.join(' + '), 'on');
    }
    if (st.os_layer) {
        chip('One-shot layer ' + st.os_layer, 'on');
    }
}

async function poll_board_state() {
    if (device == null || !device_v21() || busy) {
        return;
    }
    try {
        busy = true;
        board_state = await read_board_state();
    } catch (e) {
        console.warn('board state:', e);
        board_state = null;
    } finally {
        busy = false;
    }
    render_board_state();
}

function v21_live_setup() {
    const tab = document.getElementById('nav-live-tab');
    tab.addEventListener('shown.bs.tab', () => {
        document.getElementById('live_dry_wrap').classList.toggle('d-none', device == null || !device_v21());
        poll_board_state();
        state_timer = setInterval(poll_board_state, 700);
    });
    tab.addEventListener('hide.bs.tab', async () => {
        clearInterval(state_timer);
        state_timer = null;
        const dry = document.getElementById('live_dry');
        if (dry.checked) {
            dry.checked = false;
            await dry_run_changed();
        }
    });
    document.getElementById('live_dry').addEventListener('change', dry_run_changed);
}

async function dry_run_changed() {
    const on = document.getElementById('live_dry').checked;
    clearInterval(dry_run_timer);
    dry_run_timer = null;
    if (device == null || !device_v21()) {
        return;
    }
    const send = async () => {
        while (busy) {
            await new Promise((r) => setTimeout(r, 30));
        }
        busy = true;
        try {
            await set_dry_run(on);
        } catch (e) {
            display_error(e);
        } finally {
            busy = false;
        }
    };
    await send();
    if (on) {
        dry_run_timer = setInterval(send, 30000);  // the board turns it off by itself after 2 minutes
    }
}

// ---- Settings: board name, version, restart, safe start, auto profile rules

let board_name_draft = null;
const rule_drafts = {};

function render_board_v21() {
    const box = document.getElementById('board_v21');
    if (!box) {
        return;
    }
    if (box.contains(document.activeElement) && document.activeElement !== box) {
        return;  // don't redraw under the cursor while something here is being edited
    }
    clear_children(box);
    const ok = device != null && device_v21();
    if (device != null && board_info.recovered) {
        const r = board_info.recovered;
        const hex = (v) => '0x' + v.toString(16).padStart(8, '0');
        const stages = ['', 'reading devices', 'a device was plugged in', 'working out the mappings', 'talking to the computer', 'loading settings', 'between jobs', 'saving', 'profiles'];
        const what = r.kind == 1 ? 'crashed' : 'got stuck';
        const where = stages[r.stage] ? ' while ' + stages[r.stage] : '';
        const msg = md_element('div', { class: 'md-recovered', role: 'status' });
        msg.appendChild(md_element('b', {}, 'The board ' + what + where + ' and restarted itself.'));
        msg.appendChild(md_element('span', {}, ' If that keeps happening, send these codes: ' + 'kind ' + r.kind + ', step ' + r.stage + (r.kind == 1 ? ', at ' + hex(r.pc) + ', from ' + hex(r.lr) : '') + '.'));
        box.appendChild(msg);
    }
    if (device != null) {
        box.appendChild(autoload_switch());
        box.appendChild(md_element('p', { class: 'md-board-p' }, 'Saved in this browser for this board. If the page has settings from a file you haven\'t saved yet, they are kept instead.'));
    }
    if (!ok) {
        box.appendChild(md_element('p', { class: 'md-board-p mb-0' }, device == null
            ? 'Open the board to name it, restart it and set profiles that switch by themselves.'
            : 'Board name, restart, safe start and automatic profiles need the latest TrueMap firmware.'));
        return;
    }
    // name
    const nameRow = md_element('div', { class: 'md-kf-row' });
    nameRow.appendChild(md_element('label', { for: 'board_name' }, 'Board name'));
    const name = md_element('input', { id: 'board_name', type: 'text', class: 'form-control form-control-sm md-kf-wide', maxlength: String(BOARD_NAME_LEN), placeholder: 'TrueMap', autocomplete: 'off' });
    name.value = board_name_draft != null ? board_name_draft : board_info.name;
    name.addEventListener('input', () => { board_name_draft = name.value; });
    const save = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, 'Save name');
    save.addEventListener('click', () => profile_action(async () => {
        await save_board_name(name.value.trim());
        board_name_draft = null;
        display_info('Board name saved. It shows on the settings port (and as the device name in Standard mode) after the board restarts.');
    }));
    nameRow.appendChild(name);
    nameRow.appendChild(save);
    box.appendChild(nameRow);
    box.appendChild(md_element('p', { class: 'md-board-p' }, 'Shown as "' + (name.value || 'TrueMap') + ' settings" when you open the board, and as the device name in Standard mode. PowerMic, SpeechMike and pedal modes keep the real device names, because PowerScribe looks for them.'));
    // restart
    const btns = md_element('div', { class: 'md-board-btns' });
    const restart = md_element('button', { type: 'button', class: 'btn btn-outline-secondary' }, 'Restart the board');
    restart.addEventListener('click', () => profile_action(async () => {
        await board_cmd(RESTART_BOARD);
        display_info('The board is restarting. Click Open device again in a few seconds.');
    }));
    btns.appendChild(restart);
    box.appendChild(btns);
    box.appendChild(md_element('p', { class: 'md-board-p' }, 'Safe start: if a mapping ever locks you out, hold Esc for 2 seconds right after plugging the board in. It starts with every mapping off until the next restart; your settings stay saved.'));
    // rules: pick from what is plugged in now, or a port
    box.appendChild(md_element('h3', { class: 'md-board-lbl mt-2' }, 'Switch profile when a device is plugged in'));
    const table = md_element('table', { class: 'md-kf-table' });
    const head = md_element('tr');
    for (const h of ['When this is plugged in', 'Switch to', '']) {
        head.appendChild(md_element('th', { scope: 'col' }, h));
    }
    table.appendChild(head);
    const saved = profiles.filter((p) => p.saved);
    const choices = rule_choices();
    board_info.rules.forEach((r, i) => {
        if (r.slot == 0xFF && i > 0 && board_info.rules[i - 1].slot == 0xFF) {
            return;  // one empty row is enough
        }
        const tr = md_element('tr');
        const what = md_element('select', { class: 'form-select form-select-sm', 'aria-label': 'Device for rule ' + (i + 1) });
        what.appendChild(md_element('option', { value: '' }, 'Choose…'));
        const current = r.slot == 0xFF ? '' : rule_key(r.vid, r.pid, r.port);
        const list = choices.slice();
        if (current && !list.some((c) => c.key == current)) {
            list.unshift({ key: current, label: rule_label(r.vid, r.pid, r.port), group: 'Saved' });
        }
        const groups = {};
        for (const c of list) {
            if (!groups[c.group]) {
                groups[c.group] = md_element('optgroup', { label: c.group });
                what.appendChild(groups[c.group]);
            }
            groups[c.group].appendChild(md_element('option', { value: c.key }, c.label));
        }
        what.value = (rule_drafts[i] && rule_drafts[i].what !== undefined) ? rule_drafts[i].what : current;
        what.addEventListener('change', () => { (rule_drafts[i] ??= {}).what = what.value; });
        const slot = md_element('select', { class: 'form-select form-select-sm', 'aria-label': 'Profile for rule ' + (i + 1) });
        slot.appendChild(md_element('option', { value: '255' }, '—'));
        for (const p of saved) {
            slot.appendChild(md_element('option', { value: String(p.slot) }, (p.slot + 1) + ' · ' + (p.name || 'Profile ' + (p.slot + 1))));
        }
        slot.value = (rule_drafts[i] && rule_drafts[i].slot !== undefined) ? rule_drafts[i].slot : String(r.slot);
        slot.addEventListener('change', () => { (rule_drafts[i] ??= {}).slot = slot.value; });
        const apply = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, current ? 'Save' : 'Add');
        apply.addEventListener('click', () => profile_action(async () => {
            const s = parseInt(slot.value);
            if (s != 255 && !what.value) {
                throw new Error('Choose a device or a port first.');
            }
            const [vid, pid, port] = what.value ? what.value.split(':').map((v) => parseInt(v, 16)) : [0, 0, 0];
            await save_board_rule({ index: i, vid, pid, port, slot: what.value ? s : 255 });
            delete rule_drafts[i];
            render_board_v21();
        }));
        const del = md_element('button', { type: 'button', class: 'btn btn-sm btn-link text-danger' }, 'Remove');
        del.addEventListener('click', () => profile_action(async () => {
            await save_board_rule({ index: i, vid: 0, pid: 0, port: 0, slot: 255 });
            render_board_v21();
        }));
        for (const el of [what, slot]) {
            const td = md_element('td');
            td.appendChild(el);
            tr.appendChild(td);
        }
        const td = md_element('td');
        td.appendChild(apply);
        if (current) {
            td.appendChild(del);
        }
        tr.appendChild(td);
        table.appendChild(tr);
    });
    box.appendChild(table);
    const refresh = md_element('button', { type: 'button', class: 'btn btn-sm btn-link px-0' }, 'Plugged something in? Refresh the list');
    refresh.addEventListener('click', () => profile_action(async () => {
        await load_plugged_devices();
        render_board_v21();
    }));
    box.appendChild(refresh);
    box.appendChild(md_element('p', { class: 'md-board-p mb-0' }, 'When it is plugged in, the board switches to that profile; when it is unplugged, it goes back to the profile it was in. "Anything on port N" works for whatever you plug into that port of the hub. Kept for the board, not per profile.'));
}

const rule_key = (vid, pid, port) => [vid, pid, port].map((v) => v.toString(16)).join(':');

function device_name(vid, pid, port) {
    const vp = vid.toString(16).padStart(4, '0') + ':' + pid.toString(16).padStart(4, '0');
    const known = KNOWN_DEVICES.find(([k]) => k == vp);
    if (known) {
        return known[1];
    }
    const designated = port ? port_devices()[port] : null;
    if (designated && designated in DEVICES) {
        return DEVICES[designated].name;
    }
    return 'Device ' + vp;
}

function port_label(port) {
    const designated = port_devices()[port];
    return 'Port ' + port + (designated && designated in DEVICES ? ' (' + DEVICES[designated].name + ')' : '');
}

function rule_label(vid, pid, port) {
    if (!vid && !pid) {
        return 'Anything on ' + port_label(port).toLowerCase().replace(/^port/, 'port');
    }
    return device_name(vid, pid, port) + (port ? ' on port ' + port : '');
}

// what the user can pick: devices plugged in now, then "anything on port N"
function rule_choices() {
    const out = [];
    const seen = new Set();
    for (const d of board_info.devices || []) {
        const key = rule_key(d.vid, d.pid, 0);
        if (!seen.has(key)) {
            seen.add(key);
            out.push({ key, label: device_name(d.vid, d.pid, d.port) + (d.port ? ' (now on port ' + d.port + ')' : ''), group: 'Plugged in now' });
        }
    }
    for (let p = 1; p < 16; p++) {
        out.push({ key: rule_key(0, 0, p), label: 'Anything on ' + port_label(p), group: 'A hub port' });
    }
    return out;
}

async function load_plugged_devices() {
    board_info.devices = [];
    for (let i = 0; i < 16; i++) {
        await board_cmd(GET_DEVICE, [[UINT8, i]]);
        const [count, index, vid, pid, port] = await read_config_feature([UINT8, UINT8, UINT16, UINT16, UINT8]);
        if (i >= count) {
            break;
        }
        board_info.devices.push({ vid, pid, port });
    }
}

// ---- Settings: Key features additions

function render_key_features_v21(box, sec, check, num) {
    const x = x21();
    // scroll lock
    const sl = sec('Scroll lock');
    sl.appendChild(md_element('p', { class: 'md-board-p' }, 'While scroll lock is on, moving the mouse or trackball scrolls instead of moving the pointer. Any key or mouse button turns it off. Put "Scroll lock", "Scroll lock faster" and "slower" on buttons (outputs under TrueMap).'));
    const grid = md_element('div', { class: 'md-kf-grid' });
    x.scroll_lock.per_line.forEach((v, i) => {
        const row = md_element('div', { class: 'md-kf-row' });
        row.appendChild(md_element('span', { class: 'md-kf-name' }, 'Speed ' + (i + 1)));
        row.appendChild(md_element('span', {}, 'one line per'));
        row.appendChild(num(v, 1, 2000, (n) => { x.scroll_lock.per_line[i] = n; }, 'Speed ' + (i + 1)));
        row.appendChild(md_element('span', {}, 'of movement'));
        grid.appendChild(row);
    });
    sl.appendChild(grid);
    const start = md_element('div', { class: 'md-kf-row' });
    start.appendChild(md_element('label', { for: 'kf_sl_start' }, 'Starts at speed'));
    const ss = md_element('select', { id: 'kf_sl_start', class: 'form-select form-select-sm w-auto' });
    for (let i = 0; i < 5; i++) {
        ss.appendChild(md_element('option', { value: String(i) }, String(i + 1)));
    }
    ss.value = String(x.scroll_lock.start_speed);
    ss.addEventListener('change', () => { x.scroll_lock.start_speed = parseInt(ss.value); });
    start.appendChild(ss);
    sl.appendChild(start);
    check(sl, 'kf_sl_h', 'Sideways movement scrolls sideways', x.scroll_lock.horizontal, (v) => { x.scroll_lock.horizontal = v; });
    check(sl, 'kf_sl_inv', 'Reverse the direction', x.scroll_lock.invert, (v) => { x.scroll_lock.invert = v; });

    // pointer
    const pt = sec('Pointer and scrolling');
    const pr = md_element('div', { class: 'md-kf-row' });
    pr.appendChild(md_element('span', {}, 'Precision pointer moves at'));
    pr.appendChild(num(x.pointer_modes.precision_pct, 5, 100, (n) => { x.pointer_modes.precision_pct = n; }, 'Precision speed'));
    pr.appendChild(md_element('span', {}, '% speed; fast scroll is ×'));
    pr.appendChild(num(x.pointer_modes.fast_scroll_x, 2, 20, (n) => { x.pointer_modes.fast_scroll_x = n; }, 'Fast scroll'));
    pt.appendChild(pr);
    pt.appendChild(md_element('p', { class: 'md-board-p' }, 'Per device (by the port it is on): pointer speed, acceleration (0 = none, 10 = strong) and debounce for buttons that click twice by themselves.'));
    const table = md_element('table', { class: 'md-kf-table' });
    const head = md_element('tr');
    for (const h of ['Port', 'Speed %', 'Accel.', 'Debounce ms', '']) {
        head.appendChild(md_element('th', { scope: 'col' }, h));
    }
    table.appendChild(head);
    x.devices.forEach((d, i) => {
        const tr = md_element('tr');
        const label = d.port == 0 ? 'All ports' : 'Port ' + d.port + (port_devices()[d.port] in DEVICES ? ' · ' + DEVICES[port_devices()[d.port]].name : '');
        tr.appendChild(md_element('td', {}, label));
        for (const [k, lo, hi] of [['speed_pct', 10, 400], ['accel', 0, 10], ['debounce_ms', 0, 200]]) {
            const td = md_element('td');
            td.appendChild(num(d[k], lo, hi, (n) => { d[k] = n; }, label + ' ' + k));
            tr.appendChild(td);
        }
        const td = md_element('td');
        const del = md_element('button', { type: 'button', class: 'btn btn-sm btn-link text-danger' }, 'Remove');
        del.addEventListener('click', () => { x.devices.splice(i, 1); render_key_features_card(); });
        td.appendChild(del);
        tr.appendChild(td);
        table.appendChild(tr);
    });
    pt.appendChild(table);
    const add = md_element('div', { class: 'md-kf-row mt-2' });
    const portSel = md_element('select', { class: 'form-select form-select-sm w-auto', 'aria-label': 'Port for a new device setting' });
    for (let p = 0; p < 16; p++) {
        if (!x.devices.some((d) => d.port == p)) {
            portSel.appendChild(md_element('option', { value: String(p) }, p == 0 ? 'All ports' : 'Port ' + p));
        }
    }
    const addBtn = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, '+ Device setting');
    addBtn.addEventListener('click', () => {
        x.devices.push({ port: parseInt(portSel.value), speed_pct: 100, accel: 0, debounce_ms: 0 });
        render_key_features_card();
    });
    add.appendChild(portSel);
    add.appendChild(addBtn);
    pt.appendChild(add);

    // idle
    const idle = sec('Back to the base layer');
    const ir = md_element('div', { class: 'md-kf-row' });
    ir.appendChild(md_element('span', {}, 'After'));
    ir.appendChild(num(x.idle_seconds, 0, 3600, (n) => { x.idle_seconds = n; }, 'Idle seconds'));
    ir.appendChild(md_element('span', {}, 'seconds without input (0 = never), layers that were switched or latched on go back to layer 0.'));
    idle.appendChild(ir);
}

function v21_setup() {
    v21_live_setup();
    document.getElementById('profiles_backup').addEventListener('click', () => profile_action(backup_all_profiles));
    document.getElementById('profiles_restore_file').addEventListener('change', (e) => {
        const f = e.target.files[0];
        e.target.value = '';
        if (f) {
            profile_action(() => restore_profiles(f));
        }
    });
    document.getElementById('profiles_restore').addEventListener('click', () => document.getElementById('profiles_restore_file').click());
}

// ---------------------------------------------------------------------------
// TrueMap: output/input picker (the usage modals).

const PK_CONTAINERS = ['nothing', 'recent', 'keyboard', 'nav', 'fkey', 'mouse', 'gamepad', 'media', 'powermic', 'micdrop', 'layer', 'macro', 'more', 'other', 'extra'];

// keyboard page codes: [code, short label, width in keys]; null = gap
const PK_KEYBOARD = [
    [[0x29, 'Esc'], null, [0x3a], [0x3b], [0x3c], [0x3d], [null, 0.5], [0x3e], [0x3f], [0x40], [0x41], [null, 0.5], [0x42], [0x43], [0x44], [0x45]],
    [[0x35, '`'], [0x1e], [0x1f], [0x20], [0x21], [0x22], [0x23], [0x24], [0x25], [0x26], [0x27], [0x2d, '-'], [0x2e, '='], [0x2a, 'Bksp', 2]],
    [[0x2b, 'Tab', 1.5], [0x14], [0x1a], [0x08], [0x15], [0x17], [0x1c], [0x18], [0x0c], [0x12], [0x13], [0x2f, '['], [0x30, ']'], [0x31, '\\', 1.5]],
    [[0x39, 'Caps', 1.75], [0x04], [0x16], [0x07], [0x09], [0x0a], [0x0b], [0x0d], [0x0e], [0x0f], [0x33, ';'], [0x34, "'"], [0x28, 'Enter', 2.25]],
    [[0xe1, 'Shift', 2.25], [0x1d], [0x1b], [0x06], [0x19], [0x05], [0x11], [0x10], [0x36, ','], [0x37, '.'], [0x38, '/'], [0xe5, 'R Shift', 2.75]],
    [[0xe0, 'Ctrl', 1.25], [0xe3, 'Win', 1.25], [0xe2, 'Alt', 1.25], [0x2c, 'Space', 6.25], [0xe6, 'R Alt', 1.25], [0xe7, 'R Win', 1.25], [0x65, 'Menu', 1.25], [0xe4, 'R Ctrl', 1.25]],
];
const PK_NAV = [
    [[0x46, 'PrtSc'], [0x47, 'ScrLk'], [0x48, 'Pause']],
    [[0x49, 'Ins'], [0x4a, 'Home'], [0x4b, 'PgUp']],
    [[0x4c, 'Del'], [0x4d, 'End'], [0x4e, 'PgDn']],
    [[null, 1]],
    [[null, 1], [0x52, '↑'], [null, 1]],
    [[0x50, '←'], [0x51, '↓'], [0x4f, '→']],
];
const PK_SLOT = {};
for (const [layout, where] of [[PK_KEYBOARD, 'keyboard'], [PK_NAV, 'nav']]) {
    layout.forEach((row, r) => row.forEach((k, i) => {
        if (k && k[0] !== null) {
            PK_SLOT[k[0]] = { where, r, i, label: k[1], w: k[2] || 1 };
        }
    }));
}

const PK_ICONS = {
    '0x00090001': '◧', '0x00090002': '◨', '0x00090003': '◉', '0x00090004': '‹', '0x00090005': '›',
    '0x00010030': '↔', '0x00010031': '↕', '0x00010038': '⇕', '0x000c0238': '⇔',
    '0x000c00e9': '+', '0x000c00ea': '−', '0x000c00e2': '⊘', '0x000b002f': '🎙︎', '0x000c00cd': '⏯︎', '0x000c00b7': '⏹︎', '0x000c00b5': '⏭︎', '0x000c00b6': '⏮︎',
};
const PK_DICTATION_ICONS = { 'record': '●', 'dictate': '●', 'rewind': '⏪︎', 'fast forward': '⏩︎', 'forward': '⏩︎', 'play': '⏯︎', 'previous field': '⇤', 'tab back': '⇤', 'next field': '⇥', 'tab forward': '⇥', 'enter': '↵', 'pedal left': 'L', 'pedal middle': 'M', 'pedal right': 'R' };

const PK_HELP = {
    '0xffe40007': 'Each press goes up a gear; the other direction slows it down, then reverses',
    '0xffe40008': 'Each press goes up a gear; the other direction slows it down, then reverses',
    '0xffe40009': 'Stops any auto-scroll',
    '0xffe4000a': 'Starts scrolling up fast; press again to swap between fast and slow. The down key turns round at the same speed. Any other key stops it',
    '0xffe4000b': 'Starts scrolling down fast; press again to swap between fast and slow. The up key turns round at the same speed. Any other key stops it',
    '0xffe4000c': 'Starts up at the fast speed; each press goes one slower (fast → medium → slow → fast). The down key turns round at the same speed. Next time it starts at the speed you last used',
    '0xffe4000d': 'Starts down at the fast speed; each press goes one slower (fast → medium → slow → fast). The up key turns round at the same speed. Next time it starts at the speed you last used',
    '0xffe4000e': 'Starts up at the slow speed; each press goes one faster (slow → medium → fast → slow). The down key turns round at the same speed. Next time it starts at the speed you last used',
    '0xffe4000f': 'Starts down at the slow speed; each press goes one faster (slow → medium → fast → slow). The up key turns round at the same speed. Next time it starts at the speed you last used',
    '0xffe70001': 'Sends the last key or macro again',
    '0xffe70002': 'Types capitals until a space or punctuation (- becomes _): for acronyms',
    '0xffe70003': 'Restarts the board, as if you replugged it',
    '0xffe70004': 'The board shows up as a USB drive so you can copy new firmware onto it',
    '0xffe70005': 'Capitalises the first letter after ". ", "? " or "! " as you type',
    '0xffe70006': 'Holds the left button down until the next click: drag, window/level or pan hands-free',
    '0xffe70007': 'Mouse movement scrolls instead of moving the pointer. Any key or button turns it off',
    '0xffe70008': 'Mouse movement scrolls while this is held',
    '0xffe70009': 'Next scroll lock speed (set the 5 speeds in Settings → Key features)',
    '0xffe7000a': 'Previous scroll lock speed',
    '0xffe7000b': 'Slow, precise pointer while held: for measurements',
    '0xffe7000c': 'Turns the slow, precise pointer on or off',
    '0xffe7000d': 'Multiplies the wheel while held, to jump through long series',
    '0xffe7000e': 'One press, two clicks',
    '0x00000000': 'Sends nothing: the key is switched off',
};
function pk_help(usage, name) {
    const u = usage.toLowerCase();
    if (u in PK_HELP) {
        return PK_HELP[u];
    }
    if (/^0xffe4000[1-6]$/.test(u)) {
        return 'Scrolls on its own at a fixed speed. Press again (or Auto-scroll stop) to end it';
    }
    if (/^0xffe500e/.test(u)) {
        return 'Applies to the next key only. Press twice to lock it on (if enabled in Key features)';
    }
    if (/^0xffe501/.test(u)) {
        return 'The next key press uses this layer, then it goes back';
    }
    if (/^0xffe6/.test(u)) {
        return 'Switches to this layer and stays there until you switch back';
    }
    if (/^0xfff1/.test(u)) {
        return 'This layer is on while the key is held. Tick Sticky in the row menu to toggle it instead';
    }
    if (/^0xfffa/.test(u)) {
        return /next|previous/i.test(name) ? 'Switches to the next or previous saved profile, wrapping around' : 'Switches the whole setup to this profile';
    }
    if (/^0xfff2/.test(u)) {
        return 'Plays this macro. Build macros on the Macros tab';
    }
    if (/^0xff0[1-4]/.test(u)) {
        return 'PowerScribe receives this even when it is in the background (set the board type to match in Settings)';
    }
    if (/^0xfff3/.test(u)) {
        return 'The result of this expression (Macros → Expressions)';
    }
    if (/^0xfff5/.test(u)) {
        return 'A value an expression stored';
    }
    return '';
}

function pk_route(usage, cls) {
    const u = parseInt(usage, 16) >>> 0;
    const page = u >>> 16;
    const low = u & 0xFFFF;
    if (u === 0) {
        return 'nothing';
    }
    if (cls == 'keyboard') {
        if (page == 0x7 && low in PK_SLOT) {
            return PK_SLOT[low].where;
        }
        if (page == 0x7 && low >= 0x68 && low <= 0x73) {
            return 'fkey';
        }
        return 'more';
    }
    if (cls == 'other') {
        if (page == 0xfff1 || page == 0xfffa) {
            return 'layer';
        }
        if (page == 0xfff2) {
            return 'macro';
        }
        return 'other';
    }
    if (cls == 'micdrop' && (page == 0xffe6 || (page == 0xffe5 && (low >> 8) == 1))) {
        return 'layer';
    }
    return cls;
}

function pk_layout(container, layout) {
    if (!container) {
        return;
    }
    layout.forEach((row, r) => {
        const rowEl = md_element('div', { class: 'pk-kbrow' });
        row.forEach((k, i) => {
            const w = k ? (k[0] === null ? k[1] : (k[2] || 1)) : 0.5;
            const slot = md_element('span', { class: 'pk-slot', 'data-slot': r + '_' + i });
            slot.style.setProperty('--w', w);
            rowEl.appendChild(slot);
        });
        container.appendChild(rowEl);
    });
}

function pk_place(containers, button, usage, name, cls) {
    const where = pk_route(usage, cls);
    button.dataset.name = name;
    button.dataset.search = name;
    const u = parseInt(usage, 16) >>> 0;
    if (where == 'keyboard' || where == 'nav') {
        const slotDef = PK_SLOT[u & 0xFFFF];
        const short = slotDef.label || name.split(' ')[0];
        button.classList.add('pk-cap');
        button.style.setProperty('--w', slotDef.w);
        button.innerText = short;
        button.dataset.short = short;
        if (short.length > 3) {
            button.classList.add('pk-word');
        }
        button.dataset.search = name + ' ' + short;
        const slot = containers[where].querySelector('[data-slot="' + slotDef.r + '_' + slotDef.i + '"]');
        if (slot && !slot.querySelector('.usage_button')) {
            slot.classList.add('filled');
            slot.appendChild(button);
            return;
        }
        button.classList.remove('pk-cap');
        button.innerText = name;
        containers['more'].appendChild(button);
        return;
    }
    if (where == 'fkey') {
        button.classList.add('pk-cap');
        button.innerText = name;
        containers['fkey'].appendChild(button);
        return;
    }
    if (where == 'micdrop') {
        button.classList.add('pk-card');
        button.appendChild(md_element('b', {}, name));
        const help = pk_help(usage, name);
        if (help) {
            button.appendChild(md_element('span', {}, help));
            button.dataset.search = name + ' ' + help;
        }
        containers['micdrop'].appendChild(button);
        return;
    }
    let icon = PK_ICONS[usage.toLowerCase()];
    if (!icon && where == 'powermic') {
        const n = name.toLowerCase();
        const key = Object.keys(PK_DICTATION_ICONS).find((k) => n.includes(k));
        icon = key ? PK_DICTATION_ICONS[key] : '◆';
        button.classList.add('pk-dict');
    }
    if (where == 'nothing') {
        button.classList.add('pk-nothing');
        icon = '⊘';
        name = 'Nothing (key off)';
    }
    if (icon) {
        button.appendChild(md_element('span', { class: 'pk-ic', 'aria-hidden': 'true' }, icon));
    }
    button.appendChild(md_element('span', { class: 'pk-lbl' }, name));
    containers[where].appendChild(button);
}

function pk_recent_key(side) {
    return 'truemap_recent_' + (side == 'source' ? 'source' : 'target');
}

function pk_recent(side) {
    try {
        const v = JSON.parse(localStorage.getItem(pk_recent_key(side)) || '[]');
        return Array.isArray(v) ? v : [];
    } catch (e) {
        return [];
    }
}

function pk_remember(side, usage) {
    if (!usage || /^0x0+$/i.test(usage)) {
        return;
    }
    const list = [usage].concat(pk_recent(side).filter((x) => x.toLowerCase() != usage.toLowerCase())).slice(0, 10);
    try {
        localStorage.setItem(pk_recent_key(side), JSON.stringify(list));
    } catch (e) {
        // no storage: recent picks just aren't kept
    }
}

function pk_label_of(button) {
    return button.dataset.name || button.innerText;
}

function pk_before_show(modal_element, side, mapping, element) {
    // current value
    let current = null;
    if (side == 'macro_item') {
        current = element ? element.getAttribute('data-hid-usage') : null;
    } else if (mapping) {
        current = mapping[side + '_usage'];
    }
    // macro names on macro buttons
    if (side != 'source') {
        modal_element.querySelectorAll('.macro_usages .usage_button').forEach((b) => {
            const name = readable_target_usage_name(b.getAttribute('data-hid-usage'));
            b.dataset.name = name;
            b.dataset.search = name;
            const lbl = b.querySelector('.pk-lbl');
            if (lbl) {
                lbl.innerText = name;
            }
        });
    }
    // wheels / rings / jogs used as keys (they change as you set them up)
    const wk = modal_element.querySelector('.wheelkey_usages');
    if (wk) {
        clear_children(wk);
        (x21().wheel_keys || []).forEach((w, i) => {
            for (const a of (w.kind == 2 ? [5, 6, 3, 4, 1, 2] : [1, 2])) {
                const usage = x_wheel_usage(i, a);
                const name = wheel_key_name(usage);
                const b = md_element('button', { type: 'button', class: 'usage_button pk-pill', 'data-hid-usage': usage, title: usage });
                b.dataset.name = name;
                b.dataset.search = name;
                b.appendChild(md_element('span', { class: 'pk-ic', 'aria-hidden': 'true' }, { 1: '↻', 2: '↺', 3: '⟳', 4: '⟲', 5: '›', 6: '‹' }[a]));
                b.appendChild(md_element('span', { class: 'pk-lbl' }, name));
                wk.appendChild(b);
            }
        });
    }
    // recent row
    const recent = modal_element.querySelector('.recent_usages');
    clear_children(recent);
    for (const u of pk_recent(side)) {
        const orig = Array.from(modal_element.querySelectorAll('.usage_button:not(.pk-recent)')).find((b) => b.getAttribute('data-hid-usage').toLowerCase() == u.toLowerCase());
        if (!orig) {
            continue;
        }
        const b = md_element('button', { type: 'button', class: 'usage_button pk-pill pk-recent', 'data-hid-usage': orig.getAttribute('data-hid-usage'), title: orig.title });
        b.dataset.name = pk_label_of(orig);
        const ic = orig.querySelector('.pk-ic');
        if (ic) {
            b.appendChild(ic.cloneNode(true));
        }
        b.appendChild(md_element('span', { class: 'pk-lbl' }, side != 'source' && /^0xfff2/i.test(u) ? readable_target_usage_name(u) : pk_label_of(orig)));
        recent.appendChild(b);
        if (recent.children.length >= 8) {
            break;
        }
    }
    // highlight the current one
    modal_element.querySelectorAll('.usage_button').forEach((b) => {
        b.classList.toggle('pk-cur', !!current && b.getAttribute('data-hid-usage').toLowerCase() == String(current).toLowerCase());
    });
    const now = modal_element.querySelector('.pk-now');
    const has = current && !/^0x0+$/i.test(current);
    now.classList.toggle('d-none', !has);
    if (has) {
        now.querySelector('.pk-now-v').innerText = side == 'source' ? readable_usage_name(current) : readable_target_usage_name(current);
    }
    // title
    const forEl = modal_element.querySelector('.pk-for');
    const title = modal_element.querySelector('.usage_modal_title');
    if (side == 'target' && mapping) {
        const i = config['mappings'].indexOf(mapping);
        forEl.innerText = 'Mapping ' + (i + 1) + (mapping['source_usage'] && !/^0x0+$/i.test(mapping['source_usage']) ? ' · when you press ' + readable_usage_name(mapping['source_usage']) : '');
        title.innerText = 'What should it send?';
    } else if (side == 'source') {
        const i = mapping ? config['mappings'].indexOf(mapping) : -1;
        forEl.innerText = i >= 0 ? 'Mapping ' + (i + 1) : '';
        title.innerText = 'Which button or key?';
    } else {
        forEl.innerText = 'Macro step';
        title.innerText = 'What should this step send?';
    }
    modal_element.querySelector('.pk-help-t').innerText = 'Hover over an option to see what it does.';
}

function pk_visible(button) {
    if (button.classList.contains('d-none')) {
        return false;
    }
    for (let e = button.parentElement; e && !e.classList.contains('pk-body'); e = e.parentElement) {
        if (e.classList.contains('d-none')) {
            return false;
        }
    }
    return true;
}

function pk_update_sections(modal_element) {
    const searching = modal_element.classList.contains('pk-searching');
    const jump = modal_element.querySelector('.pk-jump');
    clear_children(jump);
    modal_element.querySelectorAll('.pk-sec').forEach((sec) => {
        const any = Array.from(sec.querySelectorAll('.usage_button')).some(pk_visible);
        const recentSec = sec.classList.contains('pk-recent-sec');
        sec.classList.toggle('d-none', !any || (recentSec && searching));
        const more = sec.querySelector('.pk-more');
        if (more) {
            more.open = searching && any;
        }
        if (any && !searching && !recentSec) {
            const chip = md_element('button', { type: 'button', class: 'pk-jchip' }, sec.dataset.name);
            chip.addEventListener('click', () => {
                if (more) {
                    more.open = true;
                }
                const body = modal_element.querySelector('.pk-body');
                body.scrollTo({ top: sec.offsetTop - body.offsetTop - 8, behavior: 'smooth' });
            });
            jump.appendChild(chip);
        }
    });
    jump.classList.toggle('d-none', searching);
}

function pk_setup() {
    for (const id of ['source_usage_modal', 'target_usage_modal']) {
        const modal_element = document.getElementById(id);
        const help = modal_element.querySelector('.pk-help-t');
        modal_element.querySelector('.pk-body').addEventListener('mouseover', (e) => {
            const b = e.target.closest('.usage_button');
            if (!b) {
                return;
            }
            const usage = b.getAttribute('data-hid-usage');
            const name = pk_label_of(b);
            const text = pk_help(usage, name);
            clear_children(help);
            help.appendChild(md_element('b', {}, name));
            if (text) {
                help.appendChild(document.createTextNode(' · ' + text));
            }
            help.appendChild(md_element('span', { class: 'pk-code' }, usage));
        });
    }
}

// ---------------------------------------------------------------------------
// TrueMap: mapping table rows.

let mt_filter = { port: null, layer: '', text: '' };

function mt_kind(usage, side) {
    const u = parseInt(usage, 16) >>> 0;
    const page = u >>> 16;
    const low = u & 0xFFFF;
    if (u === 0) {
        return { cls: 'none', ic: '—', sub: side == 'source' ? 'pick a button' : 'nothing (key off)' };
    }
    if (page == 0x7) {
        const slot = PK_SLOT[low];
        const name = side == 'source' ? readable_usage_name(usage) : readable_target_usage_name(usage);
        let ic = slot && slot.label ? slot.label : name;
        if (ic.length > 4) {
            ic = ic.replace(/^(Left|Right) /, '').slice(0, 4);
        }
        return { cls: 'key', ic, sub: 'Key' };
    }
    if (page == 0x9 || page == 0x1 || usage.toLowerCase() == '0x000c0238') {
        return { cls: 'mouse', ic: PK_ICONS[usage.toLowerCase()] || '◎', sub: 'Mouse' };
    }
    if (page == 0xc || page == 0xb) {
        return { cls: 'mouse', ic: PK_ICONS[usage.toLowerCase()] || '♪', sub: 'Media' };
    }
    if (page >= 0xff01 && page <= 0xff04) {
        const n = readable_target_usage_name(usage).toLowerCase();
        const key = Object.keys(PK_DICTATION_ICONS).find((k) => n.includes(k));
        return { cls: 'gold', ic: key ? PK_DICTATION_ICONS[key] : '◆', sub: page == 0xff02 ? 'Foot pedal' : page == 0xff04 ? 'SpeechMike' : 'PowerMic' };
    }
    if (page == 0xfff2) {
        return { cls: 'green', ic: '⧉', sub: 'Macro' };
    }
    if (page == 0xfff1) {
        return { cls: 'violet', ic: 'L' + low, sub: 'Layer while held' };
    }
    if (page == 0xfffa) {
        return { cls: 'violet', ic: low <= 8 ? 'P' + low : '⇄', sub: 'Profile' };
    }
    if (page == 0xfff3) {
        return { cls: 'violet', ic: 'ƒ', sub: 'Expression' };
    }
    if (page == 0xfff5) {
        const writer = (config['expressions'] || []).findIndex((e) => new RegExp('(^|\\s)' + low + ' store(\\s|$)').test(e || ''));
        return { cls: 'violet', ic: 'ƒ', sub: writer >= 0 ? 'set by Expression ' + (writer + 1) : 'Register' };
    }
    if ((page & 0xFFF0) == 0xffe0) {
        return { cls: 'violet', ic: '✦', sub: side == 'source' ? 'TrueMap feature' : 'TrueMap' };
    }
    return { cls: 'violet', ic: '•', sub: '' };
}

function mt_chip(button) {
    const mapping = button._mapping;
    if (!mapping) {
        return;
    }
    const side = button.classList.contains('source_button') ? 'source' : 'target';
    const usage = mapping[side + '_usage'] || '0x00000000';
    const k = mt_kind(usage, side);
    const ic = button.querySelector('.mt-ic');
    ic.className = 'mt-ic ' + k.cls;
    ic.innerText = k.ic;
    ic.classList.toggle('long', k.ic.length > 2);
    const badge = button.querySelector('.hub_port_badge');
    const sub = button.querySelector('.mt-sub');
    if (side == 'source') {
        const port = mapping_port(mapping);
        badge.classList.remove('d-none');
        badge.innerText = port ? 'P' + port : 'Any port';
        const dev = port && DEVICES[port_devices()[port]] ? DEVICES[port_devices()[port]].name : '';
        sub.innerText = dev || (port ? 'port ' + port : '');
    } else {
        const port = mapping['target_port'] || 0;
        badge.classList.toggle('d-none', !port);
        badge.innerText = 'P' + port;
        sub.innerText = k.sub + (mapping['sticky'] ? ' · press on, press off' : '');
    }
    button.classList.toggle('mt-empty-chip', /^0x0+$/i.test(usage));
}

function mt_sync(row) {
    const tap = row.querySelector('.tap_checkbox');
    const hold = row.querySelector('.hold_checkbox');
    if (!tap || !row.querySelector('.mt-seg')) {
        return;
    }
    const mode = { always: !tap.checked && !hold.checked, tap: tap.checked, hold: hold.checked };
    row.querySelectorAll('.mt-seg button').forEach((b) => {
        b.classList.toggle('on', mode[b.dataset.mode]);
        b.disabled = tap.disabled;
        b.setAttribute('aria-pressed', String(mode[b.dataset.mode]));
    });
    const scale = row.querySelector('.scaling_input');
    row.querySelector('.mt-scale').classList.toggle('set', scale.value !== '' && parseFloat(scale.value) != 1);
    const target = row.querySelector('.target_button');
    if (target) {
        mt_chip(target);
    }
}

function mt_set_check(input, value) {
    if (input.checked != value) {
        input.checked = value;
        input.dispatchEvent(new Event('change'));
    }
}

function mt_decorate(row, mapping) {
    row.querySelectorAll('.mt-seg button').forEach((b) => {
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            const tap = row.querySelector('.tap_checkbox');
            const hold = row.querySelector('.hold_checkbox');
            mt_set_check(tap, b.dataset.mode == 'tap');
            mt_set_check(hold, b.dataset.mode == 'hold');
            mt_sync(row);
            md_refresh_soon();
        });
    });
    row.querySelector('.scaling_input').addEventListener('input', () => mt_sync(row));
    row.querySelectorAll('.mt-l input').forEach((c) => c.addEventListener('change', () => mt_apply_filter()));
    row.querySelector('.mt-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        mt_menu(row, mapping, e.currentTarget);
    });
    mt_chip(row.querySelector('.source_button'));
    mt_chip(row.querySelector('.target_button'));
    mt_sync(row);
}

function mt_close_menu() {
    const m = document.getElementById('mt_menu');
    if (m) {
        m.remove();
    }
}

function mt_menu(row, mapping, anchor) {
    const open = document.getElementById('mt_menu');
    mt_close_menu();
    if (open && open._anchor === anchor) {
        return;
    }
    const menu = md_element('div', { id: 'mt_menu', class: 'mt-menu', role: 'menu' });
    menu._anchor = anchor;
    const sticky = row.querySelector('.sticky_checkbox');
    const item = (text, fn, cls = '') => {
        const b = md_element('button', { type: 'button', role: 'menuitem', class: cls }, text);
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            mt_close_menu();
            fn();
        });
        menu.appendChild(b);
    };
    item('Change the input…', () => row.querySelector('.source_button').click());
    item('Change the output…', () => row.querySelector('.target_button').click());
    item('Duplicate', () => {
        const i = config['mappings'].indexOf(mapping);
        const copy = JSON.parse(JSON.stringify(mapping));
        config['mappings'].splice(i + 1, 0, copy);
        set_mappings_ui_state();
    });
    if (!sticky.disabled) {
        item((sticky.checked ? '✓ ' : '') + 'Sticky: press on, press off', () => {
            mt_set_check(sticky, !sticky.checked);
            mt_sync(row);
        });
    }
    item('Try it in Live test', () => {
        const tab = document.getElementById('nav-live-tab');
        if (tab) {
            bootstrap.Tab.getOrCreateInstance(tab).show();
        }
    });
    menu.appendChild(md_element('div', { class: 'mt-menu-sep' }));
    item('Delete', () => row.querySelector('.delete_button').click(), 'danger');
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    const w = menu.offsetWidth;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + window.scrollX + 'px';
    let top = r.bottom + 6;
    if (top + menu.offsetHeight > window.innerHeight - 8) {
        top = r.top - menu.offsetHeight - 6;
    }
    menu.style.top = top + window.scrollY + 'px';
    menu.querySelector('button').focus();
}

function mt_ports_in_use() {
    const set = new Set();
    for (const m of config['mappings']) {
        set.add(mapping_port(m));
    }
    return Array.from(set).sort((a, b) => a - b);
}

function mt_render_ports() {
    const box = document.getElementById('mt_ports');
    if (!box) {
        return;
    }
    clear_children(box);
    const ports = mt_ports_in_use();
    if (ports.length < 2) {
        mt_filter.port = null;
        return;
    }
    const chip = (label, value) => {
        const b = md_element('button', { type: 'button', class: 'mt-fchip' + (mt_filter.port === value ? ' on' : ''), 'aria-pressed': String(mt_filter.port === value) }, label);
        b.addEventListener('click', () => {
            mt_filter.port = value;
            mt_apply_filter();
        });
        box.appendChild(b);
    };
    chip('All', null);
    for (const p of ports) {
        const dev = p && DEVICES[port_devices()[p]] ? DEVICES[port_devices()[p]].name.replace(/ keyboard.*$| \(.*\)$|^Logitech /g, '') : '';
        chip(p == 0 ? 'Any port' : 'Port ' + p + (dev ? ' · ' + dev : ''), p);
    }
}

function mt_apply_filter() {
    if (typeof config == 'undefined' || !document.getElementById('mappings')) {
        return;
    }
    if (mt_filter.port !== null && !mt_ports_in_use().includes(mt_filter.port)) {
        mt_filter.port = null;
    }
    mt_render_ports();
    const rows = document.querySelectorAll('#mappings .mapping_container');
    const text = mt_filter.text.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row, i) => {
        const m = config['mappings'][i];
        let ok = !!m;
        if (ok && mt_filter.port !== null) {
            ok = mapping_port(m) == mt_filter.port;
        }
        if (ok && mt_filter.layer !== '') {
            ok = m['layers'].includes(parseInt(mt_filter.layer));
        }
        if (ok && text) {
            ok = row.innerText.toLowerCase().includes(text);
        }
        row.classList.toggle('d-none', !ok);
        if (ok) {
            shown++;
        }
    });
    const n = config['mappings'].length;
    const count = document.getElementById('mt_count');
    if (count) {
        count.innerText = shown == n ? '· ' + n : '· ' + shown + ' of ' + n;
    }
    document.getElementById('mt_empty').classList.toggle('d-none', !(n && !shown));
}

function mt_setup() {
    document.getElementById('mt_add').addEventListener('click', () => document.getElementById('add_mapping').click());
    document.getElementById('mt_search').addEventListener('input', (e) => {
        mt_filter.text = e.target.value;
        mt_apply_filter();
    });
    document.getElementById('mt_layer').addEventListener('change', (e) => {
        mt_filter.layer = e.target.value;
        mt_apply_filter();
    });
    document.getElementById('mt_clear_filter').addEventListener('click', () => {
        mt_filter = { port: null, layer: '', text: '' };
        document.getElementById('mt_search').value = '';
        document.getElementById('mt_layer').value = '';
        mt_apply_filter();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#mt_menu')) {
            mt_close_menu();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key == 'Escape') {
            mt_close_menu();
        }
    });
    window.addEventListener('resize', mt_close_menu);
}


// ---------------------------------------------------------------------------
// TrueMap: shrink key labels in the device picture so the words fit.

let md_fit_pending = false;
function md_fit_labels_soon() {
    if (md_fit_pending) {
        return;
    }
    md_fit_pending = true;
    requestAnimationFrame(() => {
        md_fit_pending = false;
        md_fit_labels();
    });
}

function md_fit_labels() {
    const pic = document.getElementById('kb_picture');
    if (!pic || !pic.offsetWidth) {
        return;
    }
    pic.querySelectorAll('.md-key > span').forEach((span) => {
        const key = span.parentElement;
        span.style.fontSize = '';
        span.style.letterSpacing = '';
        const room = key.clientWidth - (key.classList.contains('round') ? 8 : 6);
        if (room <= 0) {
            return;
        }
        let size = parseFloat(getComputedStyle(span).fontSize);
        while (span.scrollWidth > room && size > 7.5) {
            size -= 0.5;
            span.style.fontSize = size + 'px';
            span.style.letterSpacing = '-0.02em';
        }
    });
}

(function md_fit_watch() {
    const pic = document.getElementById('kb_picture');
    if (pic && 'ResizeObserver' in window) {
        new ResizeObserver(() => md_fit_labels_soon()).observe(pic);
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => md_fit_labels_soon());
    }
})();

// ---------------------------------------------------------------------------
// TrueMap: drag mapping rows by their number to reorder them.

let mt_drag = null;

function mt_drag_setup() {
    const list = document.getElementById('mappings');
    list.addEventListener('pointerdown', (e) => {
        const handle = e.target.closest('.mt-num');
        if (!handle || e.button !== 0) {
            return;
        }
        const row = handle.closest('.mapping_container');
        const rows = Array.from(list.children);
        const from = rows.indexOf(row);
        if (from < 0) {
            return;
        }
        e.preventDefault();
        const r = row.getBoundingClientRect();
        const ghost = md_element('div', { class: 'mt-ghost' });
        ghost.appendChild(md_element('b', {}, String(from + 1)));
        ghost.appendChild(md_element('span', {}, row.querySelector('.source_button .button_label').innerText));
        ghost.appendChild(md_element('i', {}, '→'));
        ghost.appendChild(md_element('span', {}, row.querySelector('.target_button .button_label').innerText));
        ghost.style.left = (r.left + 20) + 'px';
        ghost.style.top = r.top + 'px';
        document.body.appendChild(ghost);
        row.classList.add('mt-dragging');
        mt_close_menu();
        mt_drag = { row, from, to: from, ghost, dy: e.clientY - r.top, x: r.left };
        handle.setPointerCapture(e.pointerId);
    });
    list.addEventListener('pointermove', (e) => {
        if (!mt_drag) {
            return;
        }
        mt_drag.ghost.style.top = (e.clientY - mt_drag.dy) + 'px';
        const rows = Array.from(list.children).filter((x) => !x.classList.contains('d-none'));
        let to = null;
        for (const x of rows) {
            const b = x.getBoundingClientRect();
            if (e.clientY < b.top + b.height / 2) {
                to = Array.from(list.children).indexOf(x);
                break;
            }
        }
        if (to === null) {
            to = list.children.length;
        }
        list.querySelectorAll('.mt-drop-before, .mt-drop-after').forEach((x) => x.classList.remove('mt-drop-before', 'mt-drop-after'));
        if (to < list.children.length) {
            list.children[to].classList.add('mt-drop-before');
        } else {
            rows[rows.length - 1].classList.add('mt-drop-after');
        }
        mt_drag.to = to;
        // scroll the page when dragging near the edges
        if (e.clientY < 60) {
            window.scrollBy(0, -12);
        } else if (e.clientY > window.innerHeight - 60) {
            window.scrollBy(0, 12);
        }
    });
    const finish = () => {
        if (!mt_drag) {
            return;
        }
        const { from, ghost, row } = mt_drag;
        let to = mt_drag.to;
        ghost.remove();
        row.classList.remove('mt-dragging');
        list.querySelectorAll('.mt-drop-before, .mt-drop-after').forEach((x) => x.classList.remove('mt-drop-before', 'mt-drop-after'));
        mt_drag = null;
        if (to > from) {
            to--;
        }
        if (to === from) {
            return;
        }
        const [m] = config['mappings'].splice(from, 1);
        config['mappings'].splice(to, 0, m);
        set_mappings_ui_state();
        const moved = document.getElementById('mappings').children[to];
        if (moved) {
            moved.classList.add('mt-moved');
            setTimeout(() => moved.classList.remove('mt-moved'), 900);
        }
    };
    list.addEventListener('pointerup', finish);
    list.addEventListener('pointercancel', finish);
    // keyboard: focus the number, then Alt+↑ / Alt+↓
    list.addEventListener('keydown', (e) => {
        const handle = e.target.closest('.mt-num');
        if (!handle || !e.altKey || (e.key != 'ArrowUp' && e.key != 'ArrowDown')) {
            return;
        }
        e.preventDefault();
        const from = Array.from(list.children).indexOf(handle.closest('.mapping_container'));
        const to = from + (e.key == 'ArrowUp' ? -1 : 1);
        if (to < 0 || to >= config['mappings'].length) {
            return;
        }
        const [m] = config['mappings'].splice(from, 1);
        config['mappings'].splice(to, 0, m);
        set_mappings_ui_state();
        const h = list.children[to].querySelector('.mt-num');
        h.focus();
    });
}


// ---------------------------------------------------------------------------
// TrueMap: options for a wheel / ring / jog used as keys (inspector).

function insp_wheel_key_options(set, m, u) {
    const x = x21();
    const i = (parseInt(u, 16) & 0xFFFF) >> 4;
    const w = x.wheel_keys[i];
    const add = (a, label) => {
        const src = x_wheel_usage(i, a);
        const have = config['mappings'].find((k) => x_same_key(k['source_usage'], src));
        const b = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, (have ? 'Go to ' : '+ ') + label);
        b.addEventListener('click', () => {
            const mm = wheel_keys_mapping(w.usage, w.port || 0, w.kind, a);
            set_mappings_ui_state();
            md_select(mm, true);
        });
        return b;
    };
    if (w.kind == 2) {
        set.appendChild(md_element('p', { class: 'md-insp-note' }, '"A little" fires while the ring is turned less than the far point, "far" from the far point on. "Any amount" fires for both.'));
        const row = md_element('div', { class: 'md-kf-row' });
        row.appendChild(md_element('span', {}, 'Far starts at notch'));
        const step = md_element('input', { type: 'number', class: 'form-control form-control-sm md-kf-num', min: '1', max: '7', 'aria-label': 'Far starts at notch' });
        step.value = String(w.step || 4);
        step.addEventListener('change', () => {
            const v = Math.max(1, Math.min(7, parseInt(step.value) || 4));
            step.value = String(v);
            w.step = v;
            md_mapping_changed();
        });
        row.appendChild(step);
        row.appendChild(md_element('span', { class: 'md-insp-note m-0' }, 'of 7'));
        set.appendChild(row);
        const btns = md_element('div', { class: 'md-presets' });
        btns.appendChild(add(5, 'a little right'));
        btns.appendChild(add(6, 'a little left'));
        btns.appendChild(add(3, 'far right'));
        btns.appendChild(add(4, 'far left'));
        btns.appendChild(add(1, 'right, any amount'));
        btns.appendChild(add(2, 'left, any amount'));
        set.appendChild(btns);
    } else {
        const btns = md_element('div', { class: 'md-presets' });
        btns.appendChild(add(1, w.kind == 1 ? 'jog clockwise' : 'turned up / right'));
        btns.appendChild(add(2, w.kind == 1 ? 'jog counter-clockwise' : 'turned down / left'));
        set.appendChild(btns);
    }
    const t = m['target_usage'] || '';
    if (/^0x0007/i.test(t)) {
        set.appendChild(md_element('p', { class: 'md-insp-note' }, 'Held keys repeat in Windows while the ring stays turned. For a single press per turn, put the key in a macro and map the macro instead.'));
        const once = md_element('button', { type: 'button', class: 'btn btn-sm btn-outline-secondary' }, 'Send it once per turn');
        once.addEventListener('click', () => {
            const n = macro_slot_for_single_key(t);
            if (n === null) {
                alert('All macros are in use. Clear one on the Macros tab first.');
                return;
            }
            m['target_usage'] = '0xfff2' + (n + 1).toString(16).padStart(4, '0');
            set_mappings_ui_state();
            md_select(m, true);
        });
        set.appendChild(once);
    }
}

// a macro that presses one key once: reuse one that already does, or fill a free slot
function macro_slot_for_single_key(usage) {
    const u = usage.toLowerCase();
    const n = config['macros'].length;
    let i = config['macros'].findIndex((mac) => mac.length == 1 && mac[0].length == 1 && mac[0][0].toLowerCase() == u);
    if (i < 0) {
        i = config['macros'].findIndex((mac) => mac.length == 0 || mac.every((st) => st.length == 0));
        if (i < 0 || i >= n) {
            return null;
        }
        config['macros'][i] = [[u]];
        const x = extras();
        x.macro_names = x.macro_names || {};
        x.macro_names[i] = readable_usage_name(u) + ' once';
        if (typeof set_macros_ui_state == 'function') {
            set_macros_ui_state();
        }
    }
    return i;
}


// ---------------------------------------------------------------------------
// TrueMap: copy macros between profiles. The copy is kept in this browser, so
// it survives switching profiles (which reloads the page's settings).

const MB_CLIP_KEY = 'truemap_macro_clipboard';

function mb_clip_get() {
    try {
        const c = JSON.parse(localStorage.getItem(MB_CLIP_KEY) || 'null');
        return c && Array.isArray(c.items) && c.items.length ? c : null;
    } catch (e) {
        return null;
    }
}

function mb_clip_set(c) {
    try {
        localStorage.setItem(MB_CLIP_KEY, JSON.stringify(c));
        return true;
    } catch (e) {
        return false;
    }
}

function mb_item(i) {
    const x = config['extras'] || {};
    return {
        slot: i,
        steps: JSON.parse(JSON.stringify(config['macros'][i] || [])),
        name: (x.macro_names || {})[i] || '',
        repeat: (x.macro_repeats || {})[i] || null,
    };
}

function mb_is_empty(i) {
    const m = config['macros'][i] || [];
    return m.length == 0 || m.every((st) => st.length == 0);
}

function mb_put(i, item) {
    config['macros'][i] = JSON.parse(JSON.stringify(item.steps));
    const x = extras();
    x.macro_names = x.macro_names || {};
    if (item.name) {
        x.macro_names[i] = item.name;
    } else {
        delete x.macro_names[i];
    }
    const x2 = x21();
    x2.macro_repeats = x2.macro_repeats || {};
    if (item.repeat) {
        x2.macro_repeats[i] = Object.assign({}, item.repeat);
    } else {
        delete x2.macro_repeats[i];
    }
}

function mb_clip_label(c) {
    if (c.kind == 'one') {
        const it = c.items[0];
        return 'Macro ' + (it.slot + 1) + (it.name ? ' “' + it.name + '”' : '');
    }
    return c.items.length + ' macro' + (c.items.length == 1 ? '' : 's');
}

function mb_clip_render(msg) {
    const c = mb_clip_get();
    const paste = document.getElementById('mb_paste');
    const clip = document.getElementById('mb_clip');
    if (!paste) {
        return;
    }
    paste.disabled = !c;
    paste.innerText = !c ? 'Paste' : c.kind == 'one' ? 'Paste into Macro ' + (mb_slot + 1) : 'Paste all';
    clip.innerText = msg || (c ? 'Copied: ' + mb_clip_label(c) + (c.from ? ' from ' + c.from : '') : '');
}

function mb_profile_name() {
    try {
        const t = document.querySelector('.md-prof.on .t');
        return t ? t.innerText.trim() : '';
    } catch (e) {
        return '';
    }
}

function mb_clip_setup() {
    document.getElementById('mb_copy').addEventListener('click', () => {
        if (mb_is_empty(mb_slot)) {
            mb_clip_render('Macro ' + (mb_slot + 1) + ' is empty: nothing to copy.');
            return;
        }
        const c = { kind: 'one', items: [mb_item(mb_slot)], from: mb_profile_name() };
        mb_clip_render(mb_clip_set(c) ? 'Copied ' + mb_clip_label(c) + '. Switch profile, pick a macro, then Paste.' : 'This browser blocks storage, so copying can\'t work here.');
    });
    document.getElementById('mb_copy_all').addEventListener('click', () => {
        const items = [];
        for (let i = 0; i < config['macros'].length; i++) {
            if (!mb_is_empty(i)) {
                items.push(mb_item(i));
            }
        }
        if (!items.length) {
            mb_clip_render('No macros on this profile to copy.');
            return;
        }
        const c = { kind: 'all', items, from: mb_profile_name() };
        mb_clip_render(mb_clip_set(c) ? 'Copied ' + mb_clip_label(c) + '. Switch profile, then Paste all: they go into the same macro numbers, so mappings that use them keep working.' : 'This browser blocks storage, so copying can\'t work here.');
    });
    document.getElementById('mb_paste').addEventListener('click', () => {
        const c = mb_clip_get();
        if (!c) {
            return;
        }
        if (c.kind == 'one') {
            if (!mb_is_empty(mb_slot) && !confirm('Macro ' + (mb_slot + 1) + ' already has steps. Replace them with ' + mb_clip_label(c) + '?')) {
                return;
            }
            mb_put(mb_slot, c.items[0]);
            mb_changed();
            mb_clip_render('Pasted into Macro ' + (mb_slot + 1) + '. Click Save to device to keep it.');
            return;
        }
        const clash = c.items.filter((it) => it.slot < config['macros'].length && !mb_is_empty(it.slot)).map((it) => it.slot + 1);
        if (clash.length && !confirm('Macros ' + clash.join(', ') + ' already have steps on this profile and will be replaced. Go ahead?')) {
            return;
        }
        let n = 0;
        for (const it of c.items) {
            if (it.slot < config['macros'].length) {
                mb_put(it.slot, it);
                n++;
            }
        }
        mb_changed();
        mb_clip_render('Pasted ' + n + ' macro' + (n == 1 ? '' : 's') + '. Click Save to device to keep them.');
    });
    document.getElementById('mb_slot').addEventListener('change', () => setTimeout(() => mb_clip_render(), 0));
    mb_clip_render();
}


// ---------------------------------------------------------------------------
// TrueMap: load the board's settings as soon as it is opened. On by default;
// switched off per board (by its name) in this browser, from Settings.

let page_from_file = false;  // the page holds settings from a file or an example that aren't on the board yet

function autoload_key() {
    return 'truemap_autoload:' + ((board_info && board_info.name) || '');
}

function autoload_on() {
    try {
        const v = localStorage.getItem(autoload_key());
        return v === null ? true : v == '1';
    } catch (e) {
        return true;
    }
}

function autoload_set(on) {
    try {
        localStorage.setItem(autoload_key(), on ? '1' : '0');
    } catch (e) {
        // no storage: the switch only lasts until the page is closed
    }
}

async function autoload_after_open() {
    if (device == null || !autoload_on()) {
        return;
    }
    if (page_from_file) {
        display_info('Kept the settings on this page (from a file or an example) instead of loading the board\'s. Click Save to device to put them on the board, or Load from device to replace them.');
        return;
    }
    await load_from_device();
}

function autoload_switch() {
    const row = md_element('div', { class: 'form-check form-switch md-autoload' });
    const input = md_element('input', { class: 'form-check-input', type: 'checkbox', id: 'autoload_switch', role: 'switch' });
    input.checked = autoload_on();
    input.addEventListener('change', () => autoload_set(input.checked));
    row.appendChild(input);
    row.appendChild(md_element('label', { class: 'form-check-label', for: 'autoload_switch' },
        'Load ' + (board_info && board_info.name ? '“' + board_info.name + '”' : 'this board') + '’s settings as soon as it’s opened'));
    return row;
}


// ---------------------------------------------------------------------------
// TrueMap: the board restarts to apply settings (a new device type, or when it
// hasn't enough memory to swap settings in place). Reconnect by itself.

let restart_after_save = null;

async function board_restarting() {
    try {
        const st = await read_board_state();
        return (st.flags & 0x0200) != 0;
    } catch (e) {
        return false;
    }
}

const sleep_ms = (ms) => new Promise((r) => setTimeout(r, ms));

async function reconnect_after_restart(msg) {
    display_info(msg + ' Reconnecting…');
    const was_serial = (typeof SerialLink != 'undefined') && (device instanceof SerialLink);
    try {
        await device.close();
    } catch (e) {
        // already gone
    }
    device = null;
    device_buttons_set_disabled_state(true);
    await sleep_ms(1500);
    for (let attempt = 0; attempt < 16; attempt++) {
        await sleep_ms(500);
        try {
            if (was_serial) {
                for (const port of await navigator.serial.getPorts()) {
                    const link = new SerialLink(port);
                    try {
                        await link.open();
                    } catch (e) {
                        continue;
                    }
                    device = link;
                    if (await device_opened()) {
                        break;
                    }
                    await link.close();
                    device = null;
                }
            } else if (navigator.hid) {
                const found = (await navigator.hid.getDevices()).find((d) => d.collections.some((c) => c.usagePage == 0xff00));
                if (found) {
                    device = found;
                    if (!device.opened) {
                        await device.open();
                    }
                    if (!(await device_opened())) {
                        device = null;
                    }
                }
            }
        } catch (e) {
            device = null;
        }
        if (device != null) {
            device_buttons_set_disabled_state(false);
            display_info(msg + ' Reconnected.');
            await autoload_after_open();
            return;
        }
    }
    display_info(msg + ' Click Open device when it is back (a new device type needs to be picked again).');
}
