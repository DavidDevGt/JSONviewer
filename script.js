new Vue({
    el: '#jsonEditorApp',
    data: {
        jsonInput: '',
        error: null,
        formattedJSON: '',
        mode: 'light',
    },
    computed: {
        modeButtonText() {
            return this.mode === 'light' ? 'Dark Mode' : 'Light Mode';
        }
    },
    watch: {
        mode(newVal) {
            document.body.setAttribute('class', newVal);
        }
    },
    methods: {
        toggleMode() {
            this.mode = this.mode === 'light' ? 'dark' : 'light';
        },
        validateJSON() {
            try {
                JSON.parse(this.jsonInput);
                this.error = null;
            } catch (err) {
                this.error = 'JSON inválido';
            }
        },
        formatJSON() {
            try {
                const jsonObject = JSON.parse(this.jsonInput);
                this.formattedJSON = JSON.stringify(jsonObject, null, 4);
                this.error = null;
            } catch (err) {
                this.error = 'JSON inválido';
            }
        },
        minimizeJSON() {
            try {
                const jsonObject = JSON.parse(this.jsonInput);
                this.formattedJSON = JSON.stringify(jsonObject);
                this.error = null;
            } catch (err) {
                this.error = 'JSON inválido';
            }
        },
        clear() {
            this.jsonInput = '';
            this.formattedJSON = '';
        },
        // Método para copiar el JSON formateado
        copyOutput() {
            const el = document.createElement('textarea');
            el.value = this.formattedJSON;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert("Output copiado al portapapeles");
        }
    },
    mounted() {
        this.toggleMode();
    }
});
