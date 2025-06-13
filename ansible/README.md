# Ansible: Автоматизация настройки сервера

## Структура
- `inventory` — список серверов
- `playbook.yml` — основной сценарий
- `roles/` — роли для каждого слоя

## Запуск
```sh
ansible-playbook -i inventory playbook.yml --ask-vault-pass
```

## Секреты
Для хранения секретов используйте Ansible Vault:
```sh
ansible-vault create group_vars/all/vault.yml
```
