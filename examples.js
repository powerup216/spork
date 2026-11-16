const examples = [
    {
        'description': "GE-PACS Keyboard",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 8,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": true,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00010038",
                    "source_usage": "0x00010031",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x000c0238",
                    "source_usage": "0x00010030",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xfff10001",
                    "source_usage": "0xfff50001",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00090003",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff50019",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff5001a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff5001b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff5001c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff01000a",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x00070029",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007002b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x00070039",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x000700e2",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x00070035",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007004c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007004b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff01000a",
                    "source_usage": "0x0007004e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0x0007001e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0x0007001f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0x00070020",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0x00070021",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070050",
                    "source_usage": "0xfff50004",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007004f",
                    "source_usage": "0xfff50005",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00070050",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x0007004f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "2000 port 0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul dup 25000 store",
                "2000 port 0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul dup 26000 store",
                "2000 port 0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul dup 27000 store",
                "2000 port 0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul dup 28000 store",
                "0 port 0x00070050 prev_input_state_binary not 0x00070050 input_state_binary mul 3000 recall 1000 eq not 3000 recall ifte 3000 store 0x0007004f prev_input_state_binary not 0x0007004f input_state_binary mul 3000 recall 2000 eq not 2000 mul 3000 recall ifte 3000 store 0 0x00070004 input_state_binary add 0x00070005 input_state_binary add 0x00070006 input_state_binary add 0x00070007 input_state_binary add 0x00070008 input_state_binary add 0x00070009 input_state_binary add 0x0007000a input_state_binary add 0x0007000b input_state_binary add 0x0007000c input_state_binary add 0x0007000d input_state_binary add 0x0007000e input_state_binary add 0x0007000f input_state_binary add 0x00070010 input_state_binary add 0x00070011 input_state_binary add 0x00070012 input_state_binary add 0x00070013 input_state_binary add 0x00070014 input_state_binary add 0x00070015 input_state_binary add 0x00070016 input_state_binary add 0x00070017 input_state_binary add 0x00070018 input_state_binary add 0x00070019 input_state_binary add 0x0007001a input_state_binary add 0x0007001b input_state_binary add 0x0007001c input_state_binary add 0x0007001d input_state_binary add 0x0007001e input_state_binary add 0x0007001f input_state_binary add 0x00070020 input_state_binary add 0x00070021 input_state_binary add 0x00070022 input_state_binary add 0x00070023 input_state_binary add 0x00070024 input_state_binary add 0x00070025 input_state_binary add 0x00070026 input_state_binary add 0x00070027 input_state_binary add 0x00070028 input_state_binary add 0x00070029 input_state_binary add 0x0007002a input_state_binary add 0x0007002b input_state_binary add 0x0007002c input_state_binary add 0x0007002d input_state_binary add 0x0007002e input_state_binary add 0x0007002f input_state_binary add 0x00070030 input_state_binary add 0x00070031 input_state_binary add 0x00070032 input_state_binary add 0x00070033 input_state_binary add 0x00070034 input_state_binary add 0x00070035 input_state_binary add 0x00070036 input_state_binary add 0x00070037 input_state_binary add 0x00070038 input_state_binary add 0x00070039 input_state_binary add 0x0007003a input_state_binary add 0x0007003b input_state_binary add 0x0007003c input_state_binary add 0x0007003d input_state_binary add 0x0007003e input_state_binary add 0x0007003f input_state_binary add 0x00070040 input_state_binary add 0x00070041 input_state_binary add 0x00070042 input_state_binary add 0x00070043 input_state_binary add 0x00070044 input_state_binary add 0x00070045 input_state_binary add 0x00070046 input_state_binary add 0x00070047 input_state_binary add 0x00070048 input_state_binary add 0x00070049 input_state_binary add 0x0007004a input_state_binary add 0x0007004b input_state_binary add 0x0007004c input_state_binary add 0x0007004d input_state_binary add 0x0007004e input_state_binary add 0x00070051 input_state_binary add 0x00070052 input_state_binary add 0x00070053 input_state_binary add 0x00070054 input_state_binary add 0x00070055 input_state_binary add 0x00070056 input_state_binary add 0x00070057 input_state_binary add 0x00070058 input_state_binary add 0x00070059 input_state_binary add 0x0007005a input_state_binary add 0x0007005b input_state_binary add 0x0007005c input_state_binary add 0x0007005d input_state_binary add 0x0007005e input_state_binary add 0x0007005f input_state_binary add 0x00070060 input_state_binary add 0x00070061 input_state_binary add 0x00070062 input_state_binary add 0x00070063 input_state_binary add 0x00070064 input_state_binary add 0x00070065 input_state_binary add 0x00070068 input_state_binary add 0x00070069 input_state_binary add 0x0007006a input_state_binary add 0x0007006b input_state_binary add 0x0007006c input_state_binary add 0x0007006d input_state_binary add 0x0007006e input_state_binary add 0x0007006f input_state_binary add 0x00070070 input_state_binary add 0x00070071 input_state_binary add 0x00070072 input_state_binary add 0x00070073 input_state_binary add 0x000700e0 input_state_binary add 0x000700e1 input_state_binary add 0x000700e2 input_state_binary add 0x000700e3 input_state_binary add 0x000700e4 input_state_binary add 0x000700e5 input_state_binary add 0x000700e6 input_state_binary add 0x000700e7 input_state_binary add 0x00090001 input_state_binary add 0x00090002 input_state_binary add 0x00090003 input_state_binary add 0x00090004 input_state_binary add 0x00090005 input_state_binary add 0x00090006 input_state_binary add 0x00090007 input_state_binary add 0x00090008 input_state_binary add 0 3000 recall ifte 3000 store 3000 recall 1000 eq 4000 store 3000 recall 2000 eq 5000 store 0",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "GE-PACS Macropad",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 8,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": true,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00010038",
                    "source_usage": "0x00010031",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x000c0238",
                    "source_usage": "0x00010030",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xfff10001",
                    "source_usage": "0xfff50001",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00090003",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff30003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff30004",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff30005",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff30006",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff01000a",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul",
                "0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul",
                "0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul",
                "0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul",
                "",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "Change-PACS Keyboard",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 8,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff50019",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff5001a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff5001b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff5001c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff01000a",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x00070029",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007002b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x00070039",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x000700e2",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x00070035",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007004c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007004b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff01000a",
                    "source_usage": "0x0007004e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0x0007001e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0x0007001f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0x00070020",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0x00070021",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070052",
                    "source_usage": "0xfff50004",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070051",
                    "source_usage": "0xfff50005",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00070050",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x0007004f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "2000 port 0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul dup 25000 store",
                "2000 port 0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul dup 26000 store",
                "2000 port 0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul dup 27000 store",
                "2000 port 0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul dup 28000 store",
                "0 port 0x00070050 prev_input_state_binary not 0x00070050 input_state_binary mul 3000 recall 1000 eq not 3000 recall ifte 3000 store 0x0007004f prev_input_state_binary not 0x0007004f input_state_binary mul 3000 recall 2000 eq not 2000 mul 3000 recall ifte 3000 store 0 0x00070004 input_state_binary add 0x00070005 input_state_binary add 0x00070006 input_state_binary add 0x00070007 input_state_binary add 0x00070008 input_state_binary add 0x00070009 input_state_binary add 0x0007000a input_state_binary add 0x0007000b input_state_binary add 0x0007000c input_state_binary add 0x0007000d input_state_binary add 0x0007000e input_state_binary add 0x0007000f input_state_binary add 0x00070010 input_state_binary add 0x00070011 input_state_binary add 0x00070012 input_state_binary add 0x00070013 input_state_binary add 0x00070014 input_state_binary add 0x00070015 input_state_binary add 0x00070016 input_state_binary add 0x00070017 input_state_binary add 0x00070018 input_state_binary add 0x00070019 input_state_binary add 0x0007001a input_state_binary add 0x0007001b input_state_binary add 0x0007001c input_state_binary add 0x0007001d input_state_binary add 0x0007001e input_state_binary add 0x0007001f input_state_binary add 0x00070020 input_state_binary add 0x00070021 input_state_binary add 0x00070022 input_state_binary add 0x00070023 input_state_binary add 0x00070024 input_state_binary add 0x00070025 input_state_binary add 0x00070026 input_state_binary add 0x00070027 input_state_binary add 0x00070028 input_state_binary add 0x00070029 input_state_binary add 0x0007002a input_state_binary add 0x0007002b input_state_binary add 0x0007002c input_state_binary add 0x0007002d input_state_binary add 0x0007002e input_state_binary add 0x0007002f input_state_binary add 0x00070030 input_state_binary add 0x00070031 input_state_binary add 0x00070032 input_state_binary add 0x00070033 input_state_binary add 0x00070034 input_state_binary add 0x00070035 input_state_binary add 0x00070036 input_state_binary add 0x00070037 input_state_binary add 0x00070038 input_state_binary add 0x00070039 input_state_binary add 0x0007003a input_state_binary add 0x0007003b input_state_binary add 0x0007003c input_state_binary add 0x0007003d input_state_binary add 0x0007003e input_state_binary add 0x0007003f input_state_binary add 0x00070040 input_state_binary add 0x00070041 input_state_binary add 0x00070042 input_state_binary add 0x00070043 input_state_binary add 0x00070044 input_state_binary add 0x00070045 input_state_binary add 0x00070046 input_state_binary add 0x00070047 input_state_binary add 0x00070048 input_state_binary add 0x00070049 input_state_binary add 0x0007004a input_state_binary add 0x0007004b input_state_binary add 0x0007004c input_state_binary add 0x0007004d input_state_binary add 0x0007004e input_state_binary add 0x00070051 input_state_binary add 0x00070052 input_state_binary add 0x00070053 input_state_binary add 0x00070054 input_state_binary add 0x00070055 input_state_binary add 0x00070056 input_state_binary add 0x00070057 input_state_binary add 0x00070058 input_state_binary add 0x00070059 input_state_binary add 0x0007005a input_state_binary add 0x0007005b input_state_binary add 0x0007005c input_state_binary add 0x0007005d input_state_binary add 0x0007005e input_state_binary add 0x0007005f input_state_binary add 0x00070060 input_state_binary add 0x00070061 input_state_binary add 0x00070062 input_state_binary add 0x00070063 input_state_binary add 0x00070064 input_state_binary add 0x00070065 input_state_binary add 0x00070068 input_state_binary add 0x00070069 input_state_binary add 0x0007006a input_state_binary add 0x0007006b input_state_binary add 0x0007006c input_state_binary add 0x0007006d input_state_binary add 0x0007006e input_state_binary add 0x0007006f input_state_binary add 0x00070070 input_state_binary add 0x00070071 input_state_binary add 0x00070072 input_state_binary add 0x00070073 input_state_binary add 0x000700e0 input_state_binary add 0x000700e1 input_state_binary add 0x000700e2 input_state_binary add 0x000700e3 input_state_binary add 0x000700e4 input_state_binary add 0x000700e5 input_state_binary add 0x000700e6 input_state_binary add 0x000700e7 input_state_binary add 0x00090001 input_state_binary add 0x00090002 input_state_binary add 0x00090003 input_state_binary add 0x00090004 input_state_binary add 0x00090005 input_state_binary add 0x00090006 input_state_binary add 0x00090007 input_state_binary add 0x00090008 input_state_binary add 0 3000 recall ifte 3000 store 3000 recall 1000 eq 4000 store 3000 recall 2000 eq 5000 store 0",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "Change-PACS Macropad",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 8,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff30003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff30004",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff30005",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff30006",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff01000a",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul",
                "0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul",
                "0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul",
                "0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul",
                "",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "GE-PACS Keyboard (PowerMic 4)",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 9,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": true,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00010038",
                    "source_usage": "0x00010031",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x000c0238",
                    "source_usage": "0x00010030",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xfff10001",
                    "source_usage": "0xfff50001",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00090003",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000a",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff50019",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff5001a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff5001b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff5001c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000b",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x00070029",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007002b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x00070039",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000a",
                    "source_usage": "0x000700e2",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x00070035",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007004c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007004b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000b",
                    "source_usage": "0x0007004e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0x0007001e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0x0007001f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0x00070020",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0x00070021",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070050",
                    "source_usage": "0xfff50004",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007004f",
                    "source_usage": "0xfff50005",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00070050",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x0007004f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "2000 port 0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul dup 25000 store",
                "2000 port 0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul dup 26000 store",
                "2000 port 0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul dup 27000 store",
                "2000 port 0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul dup 28000 store",
                "0 port 0x00070050 prev_input_state_binary not 0x00070050 input_state_binary mul 3000 recall 1000 eq not 3000 recall ifte 3000 store 0x0007004f prev_input_state_binary not 0x0007004f input_state_binary mul 3000 recall 2000 eq not 2000 mul 3000 recall ifte 3000 store 0 0x00070004 input_state_binary add 0x00070005 input_state_binary add 0x00070006 input_state_binary add 0x00070007 input_state_binary add 0x00070008 input_state_binary add 0x00070009 input_state_binary add 0x0007000a input_state_binary add 0x0007000b input_state_binary add 0x0007000c input_state_binary add 0x0007000d input_state_binary add 0x0007000e input_state_binary add 0x0007000f input_state_binary add 0x00070010 input_state_binary add 0x00070011 input_state_binary add 0x00070012 input_state_binary add 0x00070013 input_state_binary add 0x00070014 input_state_binary add 0x00070015 input_state_binary add 0x00070016 input_state_binary add 0x00070017 input_state_binary add 0x00070018 input_state_binary add 0x00070019 input_state_binary add 0x0007001a input_state_binary add 0x0007001b input_state_binary add 0x0007001c input_state_binary add 0x0007001d input_state_binary add 0x0007001e input_state_binary add 0x0007001f input_state_binary add 0x00070020 input_state_binary add 0x00070021 input_state_binary add 0x00070022 input_state_binary add 0x00070023 input_state_binary add 0x00070024 input_state_binary add 0x00070025 input_state_binary add 0x00070026 input_state_binary add 0x00070027 input_state_binary add 0x00070028 input_state_binary add 0x00070029 input_state_binary add 0x0007002a input_state_binary add 0x0007002b input_state_binary add 0x0007002c input_state_binary add 0x0007002d input_state_binary add 0x0007002e input_state_binary add 0x0007002f input_state_binary add 0x00070030 input_state_binary add 0x00070031 input_state_binary add 0x00070032 input_state_binary add 0x00070033 input_state_binary add 0x00070034 input_state_binary add 0x00070035 input_state_binary add 0x00070036 input_state_binary add 0x00070037 input_state_binary add 0x00070038 input_state_binary add 0x00070039 input_state_binary add 0x0007003a input_state_binary add 0x0007003b input_state_binary add 0x0007003c input_state_binary add 0x0007003d input_state_binary add 0x0007003e input_state_binary add 0x0007003f input_state_binary add 0x00070040 input_state_binary add 0x00070041 input_state_binary add 0x00070042 input_state_binary add 0x00070043 input_state_binary add 0x00070044 input_state_binary add 0x00070045 input_state_binary add 0x00070046 input_state_binary add 0x00070047 input_state_binary add 0x00070048 input_state_binary add 0x00070049 input_state_binary add 0x0007004a input_state_binary add 0x0007004b input_state_binary add 0x0007004c input_state_binary add 0x0007004d input_state_binary add 0x0007004e input_state_binary add 0x00070051 input_state_binary add 0x00070052 input_state_binary add 0x00070053 input_state_binary add 0x00070054 input_state_binary add 0x00070055 input_state_binary add 0x00070056 input_state_binary add 0x00070057 input_state_binary add 0x00070058 input_state_binary add 0x00070059 input_state_binary add 0x0007005a input_state_binary add 0x0007005b input_state_binary add 0x0007005c input_state_binary add 0x0007005d input_state_binary add 0x0007005e input_state_binary add 0x0007005f input_state_binary add 0x00070060 input_state_binary add 0x00070061 input_state_binary add 0x00070062 input_state_binary add 0x00070063 input_state_binary add 0x00070064 input_state_binary add 0x00070065 input_state_binary add 0x00070068 input_state_binary add 0x00070069 input_state_binary add 0x0007006a input_state_binary add 0x0007006b input_state_binary add 0x0007006c input_state_binary add 0x0007006d input_state_binary add 0x0007006e input_state_binary add 0x0007006f input_state_binary add 0x00070070 input_state_binary add 0x00070071 input_state_binary add 0x00070072 input_state_binary add 0x00070073 input_state_binary add 0x000700e0 input_state_binary add 0x000700e1 input_state_binary add 0x000700e2 input_state_binary add 0x000700e3 input_state_binary add 0x000700e4 input_state_binary add 0x000700e5 input_state_binary add 0x000700e6 input_state_binary add 0x000700e7 input_state_binary add 0x00090001 input_state_binary add 0x00090002 input_state_binary add 0x00090003 input_state_binary add 0x00090004 input_state_binary add 0x00090005 input_state_binary add 0x00090006 input_state_binary add 0x00090007 input_state_binary add 0x00090008 input_state_binary add 0 3000 recall ifte 3000 store 3000 recall 1000 eq 4000 store 3000 recall 2000 eq 5000 store 0",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "GE-PACS Macropad (PowerMic 4)",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 9,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": true,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00010038",
                    "source_usage": "0x00010031",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x000c0238",
                    "source_usage": "0x00010030",
                    "scaling": 1,
                    "layers": [
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xfff10001",
                    "source_usage": "0xfff50001",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00090003",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000a",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff30003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff30004",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff30005",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff30006",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000b",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul",
                "0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul",
                "0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul",
                "0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul",
                "",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "Change-PACS Keyboard (PowerMic 4)",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 9,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000a",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff50019",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff5001a",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff5001b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff5001c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 2,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000b",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x00070029",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007002b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x00070039",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000a",
                    "source_usage": "0x000700e2",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x00070035",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007004c",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007004b",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000b",
                    "source_usage": "0x0007004e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0x0007001e",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0x0007001f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0x00070020",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0x00070021",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 3,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070052",
                    "source_usage": "0xfff50004",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070051",
                    "source_usage": "0xfff50005",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x00070050",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00000000",
                    "source_usage": "0x0007004f",
                    "scaling": 1000,
                    "layers": [
                        0,
                        1
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "2000 port 0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul dup 25000 store",
                "2000 port 0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul dup 26000 store",
                "2000 port 0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul dup 27000 store",
                "2000 port 0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul dup 28000 store",
                "0 port 0x00070050 prev_input_state_binary not 0x00070050 input_state_binary mul 3000 recall 1000 eq not 3000 recall ifte 3000 store 0x0007004f prev_input_state_binary not 0x0007004f input_state_binary mul 3000 recall 2000 eq not 2000 mul 3000 recall ifte 3000 store 0 0x00070004 input_state_binary add 0x00070005 input_state_binary add 0x00070006 input_state_binary add 0x00070007 input_state_binary add 0x00070008 input_state_binary add 0x00070009 input_state_binary add 0x0007000a input_state_binary add 0x0007000b input_state_binary add 0x0007000c input_state_binary add 0x0007000d input_state_binary add 0x0007000e input_state_binary add 0x0007000f input_state_binary add 0x00070010 input_state_binary add 0x00070011 input_state_binary add 0x00070012 input_state_binary add 0x00070013 input_state_binary add 0x00070014 input_state_binary add 0x00070015 input_state_binary add 0x00070016 input_state_binary add 0x00070017 input_state_binary add 0x00070018 input_state_binary add 0x00070019 input_state_binary add 0x0007001a input_state_binary add 0x0007001b input_state_binary add 0x0007001c input_state_binary add 0x0007001d input_state_binary add 0x0007001e input_state_binary add 0x0007001f input_state_binary add 0x00070020 input_state_binary add 0x00070021 input_state_binary add 0x00070022 input_state_binary add 0x00070023 input_state_binary add 0x00070024 input_state_binary add 0x00070025 input_state_binary add 0x00070026 input_state_binary add 0x00070027 input_state_binary add 0x00070028 input_state_binary add 0x00070029 input_state_binary add 0x0007002a input_state_binary add 0x0007002b input_state_binary add 0x0007002c input_state_binary add 0x0007002d input_state_binary add 0x0007002e input_state_binary add 0x0007002f input_state_binary add 0x00070030 input_state_binary add 0x00070031 input_state_binary add 0x00070032 input_state_binary add 0x00070033 input_state_binary add 0x00070034 input_state_binary add 0x00070035 input_state_binary add 0x00070036 input_state_binary add 0x00070037 input_state_binary add 0x00070038 input_state_binary add 0x00070039 input_state_binary add 0x0007003a input_state_binary add 0x0007003b input_state_binary add 0x0007003c input_state_binary add 0x0007003d input_state_binary add 0x0007003e input_state_binary add 0x0007003f input_state_binary add 0x00070040 input_state_binary add 0x00070041 input_state_binary add 0x00070042 input_state_binary add 0x00070043 input_state_binary add 0x00070044 input_state_binary add 0x00070045 input_state_binary add 0x00070046 input_state_binary add 0x00070047 input_state_binary add 0x00070048 input_state_binary add 0x00070049 input_state_binary add 0x0007004a input_state_binary add 0x0007004b input_state_binary add 0x0007004c input_state_binary add 0x0007004d input_state_binary add 0x0007004e input_state_binary add 0x00070051 input_state_binary add 0x00070052 input_state_binary add 0x00070053 input_state_binary add 0x00070054 input_state_binary add 0x00070055 input_state_binary add 0x00070056 input_state_binary add 0x00070057 input_state_binary add 0x00070058 input_state_binary add 0x00070059 input_state_binary add 0x0007005a input_state_binary add 0x0007005b input_state_binary add 0x0007005c input_state_binary add 0x0007005d input_state_binary add 0x0007005e input_state_binary add 0x0007005f input_state_binary add 0x00070060 input_state_binary add 0x00070061 input_state_binary add 0x00070062 input_state_binary add 0x00070063 input_state_binary add 0x00070064 input_state_binary add 0x00070065 input_state_binary add 0x00070068 input_state_binary add 0x00070069 input_state_binary add 0x0007006a input_state_binary add 0x0007006b input_state_binary add 0x0007006c input_state_binary add 0x0007006d input_state_binary add 0x0007006e input_state_binary add 0x0007006f input_state_binary add 0x00070070 input_state_binary add 0x00070071 input_state_binary add 0x00070072 input_state_binary add 0x00070073 input_state_binary add 0x000700e0 input_state_binary add 0x000700e1 input_state_binary add 0x000700e2 input_state_binary add 0x000700e3 input_state_binary add 0x000700e4 input_state_binary add 0x000700e5 input_state_binary add 0x000700e6 input_state_binary add 0x000700e7 input_state_binary add 0x00090001 input_state_binary add 0x00090002 input_state_binary add 0x00090003 input_state_binary add 0x00090004 input_state_binary add 0x00090005 input_state_binary add 0x00090006 input_state_binary add 0x00090007 input_state_binary add 0x00090008 input_state_binary add 0 3000 recall ifte 3000 store 3000 recall 1000 eq 4000 store 3000 recall 2000 eq 5000 store 0",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "Change-PACS Macropad (PowerMic 4)",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 9,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000a",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff30003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff30004",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff30005",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff30006",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff03000b",
                    "source_usage": "0x00070041",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003f",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x00070040",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "1000 recall eol eol 2000 recall eol 0x00090001 input_state_binary not eol mul eol bitwise_or eol eol 1000 recall eol 0x00090001 prev_input_state_binary eol mul eol 0x00090001 input_state_binary not eol mul eol not eol mul eol eol 1000 store",
                "0x00090003 tap_state 2000 store",
                "0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul",
                "0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul",
                "0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul",
                "0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul",
                "",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "Change-PACS Foot Pedal",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 7,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 1,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0xff020002",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff020003",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff020001",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x000700e0",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001e",
                    "source_usage": "0xfff50015",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070022",
                    "source_usage": "0xfff30003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001f",
                    "source_usage": "0xfff50016",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070023",
                    "source_usage": "0xfff30004",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070020",
                    "source_usage": "0xfff50017",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070024",
                    "source_usage": "0xfff30005",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070021",
                    "source_usage": "0xfff50018",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x00070025",
                    "source_usage": "0xfff30006",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0x0007001d",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "",
                "",
                "0x0007001e prev_input_state_binary 0x0007001e input_state_binary not mul 11000 recall not 11000 recall ifte 11000 store 0x0007001e input_state_binary 11000 recall not mul 21000 store 0x0007001e input_state_binary 11000 recall mul",
                "0x0007001f prev_input_state_binary 0x0007001f input_state_binary not mul 12000 recall not 12000 recall ifte 12000 store 0x0007001f input_state_binary 12000 recall not mul 22000 store 0x0007001f input_state_binary 12000 recall mul",
                "0x00070020 prev_input_state_binary 0x00070020 input_state_binary not mul 13000 recall not 13000 recall ifte 13000 store 0x00070020 input_state_binary 13000 recall not mul 23000 store 0x00070020 input_state_binary 13000 recall mul",
                "0x00070021 prev_input_state_binary 0x00070021 input_state_binary not mul 14000 recall not 14000 recall ifte 14000 store 0x00070021 input_state_binary 14000 recall not mul 24000 store 0x00070021 input_state_binary 14000 recall mul",
                "",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "PowerScribe foot pedal: F1 left, F2 middle, F3 right pedal (foot pedal firmware)",
        'config': {
            "version": 16,
            "unmapped_passthrough_layers": [
                0
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 7,
            "ignore_auth_dev_inputs": false,
            "input_labels": 0,
            "mappings": [
                {
                    "target_usage": "0xff020001",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff020002",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff020003",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ],
            "macro_entry_duration": 1,
            "gpio_output_mode": 0,
            "quirks": []
        }
    },
    {
        'description': "PowerScribe: F1 tab backward, F2 dictate, F3 tab forward, F4 enter/select (PowerMic 4)",
        'config': {
            "version": 18,
            "unmapped_passthrough_layers": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 9,
            "ignore_auth_dev_inputs": false,
            "macro_entry_duration": 100,
            "gpio_output_mode": 0,
            "input_labels": 0,
            "normalize_gamepad_inputs": true,
            "mappings": [
                {
                    "target_usage": "0xff030005",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030001",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030004",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff030008",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ],
            "quirks": []
        }
    },
    {
        'description': "PowerScribe: F1 previous field, F2 dictate, F3 next field, F4 custom left (PowerMic II)",
        'config': {
            "version": 16,
            "unmapped_passthrough_layers": [
                0
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 8,
            "ignore_auth_dev_inputs": false,
            "input_labels": 0,
            "mappings": [
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x0007003a",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x0007003b",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x0007003c",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010008",
                    "source_usage": "0x0007003d",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ],
            "macro_entry_duration": 1,
            "gpio_output_mode": 0,
            "quirks": []
        }
    },
    {
        'description': "PowerScribe: mouse back/forward buttons are previous/next field, middle button is dictate (PowerMic II)",
        'config': {
            "version": 16,
            "unmapped_passthrough_layers": [
                0
            ],
            "partial_scroll_timeout": 1000000,
            "tap_hold_threshold": 200000,
            "gpio_debounce_time_ms": 5,
            "interval_override": 0,
            "our_descriptor_number": 8,
            "ignore_auth_dev_inputs": false,
            "input_labels": 0,
            "mappings": [
                {
                    "target_usage": "0xff010002",
                    "source_usage": "0x00090004",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010004",
                    "source_usage": "0x00090005",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                },
                {
                    "target_usage": "0xff010003",
                    "source_usage": "0x00090003",
                    "scaling": 1000,
                    "layers": [
                        0
                    ],
                    "sticky": false,
                    "tap": false,
                    "hold": false,
                    "source_port": 0,
                    "target_port": 0
                }
            ],
            "macros": [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            ],
            "expressions": [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                ""
            ],
            "macro_entry_duration": 1,
            "gpio_output_mode": 0,
            "quirks": []
        }
    },
];

export default examples;
