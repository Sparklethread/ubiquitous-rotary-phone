let elementCount = 0;
let selectedElement = null;
let movingElement = null;
let draggingElement = null;
let offsetX, offsetY;

function snapToGrid(value) {
    return Math.round(value / 10) * 10;
}

function startAddingElement(type) {
    elementCount++;
    const newElement = document.createElement('div');
    newElement.className = 'moving-element';
    newElement.style.position = 'absolute';
    newElement.style.top = '0px';
    newElement.style.left = '0px';

    switch (type) {
        case 'button':
            newElement.innerHTML = `<button id="element${elementCount}">Button ${elementCount}</button>`;
            break;
        case 'text':
            newElement.innerHTML = `<input type="text" id="element${elementCount}" placeholder="Text Input ${elementCount}">`;
            break;
        case 'label':
            newElement.innerHTML = `<label id="element${elementCount}">Label ${elementCount}</label>`;
            break;
        case 'checkbox':
            newElement.innerHTML = `<input type="checkbox" id="element${elementCount}"> Checkbox ${elementCount}`;
            break;
        case 'radio':
            newElement.innerHTML = `<input type="radio" name="radioGroup" id="element${elementCount}"> Radio ${elementCount}`;
            break;
        case 'dropdown':
            newElement.innerHTML = `<select id="element${elementCount}"><option>Option 1</option><option>Option 2</option></select>`;
            break;
        case 'textarea':
            newElement.innerHTML = `<textarea id="element${elementCount}" placeholder="Textarea ${elementCount}"></textarea>`;
            break;
        case 'slider':
            newElement.innerHTML = `<input type="range" id="element${elementCount}" min="0" max="100" value="50">`;
            break;
        case 'image':
            newElement.innerHTML = `<img id="element${elementCount}" src="https://via.placeholder.com/150" alt="Image ${elementCount}">`;
            break;
    }

    document.body.appendChild(newElement);
    movingElement = newElement;
}

function followMouse(event) {
    if (movingElement) {
        movingElement.style.top = `${snapToGrid(event.clientY)}px`;
        movingElement.style.left = `${snapToGrid(event.clientX)}px`;
    } else if (draggingElement) {
        const rect = document.getElementById('preview-area').getBoundingClientRect();
        draggingElement.style.top = `${snapToGrid(event.clientY - rect.top - offsetY)}px`;
        draggingElement.style.left = `${snapToGrid(event.clientX - rect.left - offsetX)}px`;
    }
}

function placeElement(event) {
    if (movingElement) {
        const previewArea = document.getElementById('preview-area');
        const rect = previewArea.getBoundingClientRect();
        const newElement = movingElement.cloneNode(true);
        newElement.classList.remove('moving-element');
        newElement.classList.add('draggable');
        newElement.style.position = 'absolute';
        newElement.style.top = `${snapToGrid(event.clientY - rect.top)}px`;
        newElement.style.left = `${snapToGrid(event.clientX - rect.left)}px`;

        newElement.firstChild.onclick = () => selectElement(newElement.firstChild.id);
        newElement.onmousedown = (e) => startDragging(e, newElement);

        previewArea.appendChild(newElement);
        document.body.removeChild(movingElement);
        movingElement = null;
    }
}

function startDragging(event, element) {
    draggingElement = element;
    const rect = element.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    document.addEventListener('mousemove', followMouse);
    document.addEventListener('mouseup', stopDragging);
}

function stopDragging() {
    document.removeEventListener('mousemove', followMouse);
    document.removeEventListener('mouseup', stopDragging);
    draggingElement = null;
}

function selectElement(id) {
    selectedElement = document.getElementById(id);
    document.getElementById('element-id').value = id;
    document.getElementById('element-x').value = parseInt(selectedElement.parentElement.style.left);
    document.getElementById('element-y').value = parseInt(selectedElement.parentElement.style.top);
    document.getElementById('element-width').value = selectedElement.parentElement.offsetWidth;
    document.getElementById('element-height').value = selectedElement.parentElement.offsetHeight;
    document.getElementById('element-properties').style.display = 'block';
}

function updateElement() {
    if (selectedElement) {
        const x = snapToGrid(document.getElementById('element-x').value);
        const y = snapToGrid(document.getElementById('element-y').value);
        const width = document.getElementById('element-width').value;
        const height = document.getElementById('element-height').value;

        selectedElement.parentElement.style.left = `${x}px`;
        selectedElement.parentElement.style.top = `${y}px`;
        selectedElement.parentElement.style.width = `${width}px`;
        selectedElement.parentElement.style.height = `${height}px`;
    }
}

function updateForm() {
    const formWidth = snapToGrid(document.getElementById('form-width').value);
    const formHeight = snapToGrid(document.getElementById('form-height').value);
    const previewArea = document.getElementById('preview-area');

    previewArea.style.width = `${formWidth}px`;
    previewArea.style.height = `${formHeight}px`;
}

function generateScript() {
    const previewArea = document.getElementById('preview-area');
    const elements = previewArea.children;
    const formWidth = previewArea.offsetWidth;
    const formHeight = previewArea.offsetHeight;
    let script = `Add-Type -AssemblyName PresentationFramework\n`;
    script += `$window = New-Object System.Windows.Window\n`;
    script += `$window.Title = "WPF Window"\n`;
    script += `$window.Width = ${formWidth}\n`;
    script += `$window.Height = ${formHeight}\n`;
    script += `$window.WindowStartupLocation = "CenterScreen"\n`;

    script += `$canvas = New-Object System.Windows.Controls.Canvas\n`;

    for (let element of elements) {
        const id = element.firstChild.id;
        const marginLeft = parseInt(element.style.left);
        const marginTop = parseInt(element.style.top);
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        let controlScript = '';

        switch (element.firstChild.tagName) {
            case 'BUTTON':
                controlScript += `$button${id} = New-Object System.Windows.Controls.Button\n`;
                controlScript += `$button${id}.Content = "${element.firstChild.innerText}"\n`;
                controlScript += `$button${id}.Width = ${width}\n`;
                controlScript += `$button${id}.Height = ${height}\n`;
                controlScript += `$button${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                controlScript += `$button${id}.Add_Click({ [System.Windows.MessageBox]::Show("Button ${element.firstChild.innerText} Clicked!") })\n`;
                script += controlScript;
                script += `[System.Windows.Controls.Canvas]::SetLeft($button${id}, ${marginLeft})\n`;
                script += `[System.Windows.Controls.Canvas]::SetTop($button${id}, ${marginTop})\n`;
                script += `$canvas.Children.Add($button${id})\n`;
                break;

            case 'INPUT':
                if (element.firstChild.type === 'text') {
                    controlScript += `$textBox${id} = New-Object System.Windows.Controls.TextBox\n`;
                    controlScript += `$textBox${id}.Text = "${element.firstChild.placeholder}"\n`;
                    controlScript += `$textBox${id}.Width = ${width}\n`;
                    controlScript += `$textBox${id}.Height = ${height}\n`;
                    controlScript += `$textBox${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                    script += controlScript;
                    script += `[System.Windows.Controls.Canvas]::SetLeft($textBox${id}, ${marginLeft})\n`;
                    script += `[System.Windows.Controls.Canvas]::SetTop($textBox${id}, ${marginTop})\n`;
                    script += `$canvas.Children.Add($textBox${id})\n`;
                } else if (element.firstChild.type === 'checkbox') {
                    controlScript += `$checkBox${id} = New-Object System.Windows.Controls.CheckBox\n`;
                    controlScript += `$checkBox${id}.Content = "${element.innerText.trim()}"\n`;
                    controlScript += `$checkBox${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                    script += controlScript;
                    script += `[System.Windows.Controls.Canvas]::SetLeft($checkBox${id}, ${marginLeft})\n`;
                    script += `[System.Windows.Controls.Canvas]::SetTop($checkBox${id}, ${marginTop})\n`;
                    script += `$canvas.Children.Add($checkBox${id})\n`;
                } else if (element.firstChild.type === 'radio') {
                    controlScript += `$radioButton${id} = New-Object System.Windows.Controls.RadioButton\n`;
                    controlScript += `$radioButton${id}.Content = "${element.innerText.trim()}"\n`;
                    controlScript += `$radioButton${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                    script += controlScript;
                    script += `[System.Windows.Controls.Canvas]::SetLeft($radioButton${id}, ${marginLeft})\n`;
                    script += `[System.Windows.Controls.Canvas]::SetTop($radioButton${id}, ${marginTop})\n`;
                    script += `$canvas.Children.Add($radioButton${id})\n`;
                }
                break;

            case 'SELECT':
                controlScript += `$comboBox${id} = New-Object System.Windows.Controls.ComboBox\n`;
                controlScript += `$comboBox${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                for (let option of element.firstChild.options) {
                    controlScript += `$comboBox${id}.Items.Add("${option.text}")\n`;
                }
                script += controlScript;
                script += `[System.Windows.Controls.Canvas]::SetLeft($comboBox${id}, ${marginLeft})\n`;
                script += `[System.Windows.Controls.Canvas]::SetTop($comboBox${id}, ${marginTop})\n`;
                script += `$canvas.Children.Add($comboBox${id})\n`;
                break;

            case 'TEXTAREA':
                controlScript += `$textArea${id} = New-Object System.Windows.Controls.TextBox\n`;
                controlScript += `$textArea${id}.Text = "${element.firstChild.placeholder}"\n`;
                controlScript += `$textArea${id}.Width = ${width}\n`;
                controlScript += `$textArea${id}.Height = ${height}\n`;
                controlScript += `$textArea${id}.AcceptsReturn = $true\n`;
                controlScript += `$textArea${id}.TextWrapping = "Wrap"\n`;
                controlScript += `$textArea${id}.VerticalScrollBarVisibility = "Auto"\n`;
                controlScript += `$textArea${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                script += controlScript;
                script += `[System.Windows.Controls.Canvas]::SetLeft($textArea${id}, ${marginLeft})\n`;
                script += `[System.Windows.Controls.Canvas]::SetTop($textArea${id}, ${marginTop})\n`;
                script += `$canvas.Children.Add($textArea${id})\n`;
                break;

            case 'LABEL':
                controlScript += `$label${id} = New-Object System.Windows.Controls.Label\n`;
                controlScript += `$label${id}.Content = "${element.firstChild.innerText}"\n`;
                controlScript += `$label${id}.Width = ${width}\n`;
                controlScript += `$label${id}.Height = ${height}\n`;
                controlScript += `$label${id}.Margin = [System.Windows.Thickness]::new(0)\n`;
                script += controlScript;
                script += `[System.Windows.Controls.Canvas]::SetLeft($label${id}, ${marginLeft})\n`;
                script += `[System.Windows.Controls.Canvas]::SetTop($label${id}, ${marginTop})\n`;
                script += `$canvas.Children.Add($label${id})\n`;
                break;
        }
    }

    script += `$window.Content = $canvas\n`;
    script += `$window.ShowDialog()\n`;

    document.getElementById('script-output').innerText = script;
}

function copyToClipboard() {
    const scriptOutput = document.getElementById('script-output').innerText;
    navigator.clipboard.writeText(scriptOutput).then(() => {
        alert("PowerShell script copied to clipboard!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
